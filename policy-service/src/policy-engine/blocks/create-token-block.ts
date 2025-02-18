import { PolicyUtils } from '@policy-engine/helpers/utils';
import { BlockActionError } from '@policy-engine/errors';
import { ActionCallback, StateField } from '@policy-engine/helpers/decorators';
import {
    IPolicyBlock,
    IPolicyDocument,
    IPolicyEventState,
    IPolicyRequestBlock,
} from '@policy-engine/policy-engine.interface';
import {
    IPolicyEvent,
    PolicyInputEventType,
    PolicyOutputEventType,
} from '@policy-engine/interfaces';
import {
    ChildrenType,
    ControlType,
} from '@policy-engine/interfaces/block-about';
import { EventBlock } from '@policy-engine/helpers/decorators/event-block';
import { PolicyComponentsUtils } from '@policy-engine/policy-components-utils';
import { IPolicyUser } from '@policy-engine/policy-user';
import { CatchErrors } from '@policy-engine/helpers/decorators/catch-errors';
import { MessageAction, MessageServer, TokenMessage } from '@guardian/common';
import { ExternalEvent, ExternalEventType } from '@policy-engine/interfaces/external-event';

/**
 * Create Token block
 */
@EventBlock({
    blockType: 'createTokenBlock',
    commonBlock: false,
    about: {
        label: 'Create Token',
        title: `Add 'Create Token' Block`,
        post: true,
        get: true,
        children: ChildrenType.None,
        control: ControlType.UI,
        input: [PolicyInputEventType.RunEvent],
        output: [
            PolicyOutputEventType.RunEvent,
            PolicyOutputEventType.RefreshEvent,
        ],
        defaultEvent: true,
    },
    variables: [
        { path: 'options.template', alias: 'template', type: 'TokenTemplate' }
    ]
})
export class CreateTokenBlock {
    /**
     * Block state
     */
    @StateField()
    public readonly state: {
        [key: string]: {
            /**
             * Is active
             */
            active: boolean,
            /**
             * Event data
             */
            data?: IPolicyEventState
        }
    } = {};

    /**
     * Change active state
     * @param user
     * @param active
     */
    private changeActive(user: IPolicyUser, active: boolean) {
        const ref = PolicyComponentsUtils.GetBlockRef(this);
        if (this.state.hasOwnProperty(user.id)) {
            this.state[user.id].active = active;
        } else {
            this.state[user.id] = { active };
        }
        ref.updateBlock(this.state[user.id], user);
        ref.triggerEvents(PolicyOutputEventType.RefreshEvent, user, null);
    }

    /**
     * Get active state
     * @param user
     */
    private getActive(user: IPolicyUser) {
        if (!this.state.hasOwnProperty(user.id)) {
            this.state[user.id] = { active: true };
        } else {
            if (this.state[user.id].active === undefined) {
                this.state[user.id].active = true;
            }
        }
        return this.state[user.id].active;
    }

    /**
     * Get block data
     * @param user
     */
    async getData(user: IPolicyUser): Promise<any> {
        const options = PolicyComponentsUtils.GetBlockUniqueOptionsObject(this);
        const ref = PolicyComponentsUtils.GetBlockRef<IPolicyRequestBlock>(this);
        const tokenTemplate = PolicyUtils.getTokenTemplate(ref, ref.options.template);
        if (tokenTemplate) {
            const templateFields = Object.keys(tokenTemplate);
            for (const fieldName of templateFields) {
                if (
                    tokenTemplate[fieldName] === '' ||
                    tokenTemplate[fieldName] === null ||
                    tokenTemplate[fieldName] === undefined
                ) {
                    delete tokenTemplate[fieldName];
                }
            }
        }
        return {
            id: ref.uuid,
            blockType: ref.blockType,
            uiMetaData: options.uiMetaData || {},
            active: this.getActive(user),
            data: tokenTemplate,
        };
    }

    /**
     * Set block data
     * @param user
     * @param _data
     */
    @ActionCallback({
        output: [
            PolicyOutputEventType.RunEvent,
            PolicyOutputEventType.RefreshEvent,
        ],
    })
    async setData(user: IPolicyUser, data: any): Promise<any> {
        const ref = PolicyComponentsUtils.GetBlockRef(this);
        ref.log(`setData`);

        if (!user.did) {
            throw new BlockActionError(
                'User have no any did',
                ref.blockType,
                ref.uuid
            );
        }

        const active = this.getActive(user);
        if (!active) {
            throw new BlockActionError(
                'Block not available',
                ref.blockType,
                ref.uuid
            );
        }

        try {
            this.changeActive(user, false);
            const root = await PolicyUtils.getHederaAccount(ref, ref.policyOwner);

            if (
                !this.state.hasOwnProperty(user.id) ||
                !this.state[user.id].data ||
                !this.state[user.id].data.data
            ) {
                throw new BlockActionError(
                    'Document not found',
                    ref.blockType,
                    ref.uuid
                );
            }

            // #region Create new token

            const tokenTemplate = PolicyUtils.getTokenTemplate(ref, ref.options.template);
            if (!tokenTemplate) {
                throw new BlockActionError(
                    'Token template not found',
                    ref.blockType,
                    ref.uuid
                );
            }
            const templateFields = Object.keys(tokenTemplate);
            for (const fieldName of templateFields) {
                if (
                    tokenTemplate[fieldName] === '' ||
                    tokenTemplate[fieldName] === null ||
                    tokenTemplate[fieldName] === undefined
                ) {
                    delete tokenTemplate[fieldName];
                }
            }

            const createdToken = await PolicyUtils.createTokenByTemplate(
                ref,
                Object.assign(data, tokenTemplate),
                root
            );
            // #endregion

            // #region Send new token to hedera
            const rootTopic = await PolicyUtils.getInstancePolicyTopic(ref);
            const messageServer = new MessageServer(
                root.hederaAccountId,
                root.hederaAccountKey,
                ref.dryRun
            ).setTopicObject(rootTopic);
            const tokenMessage = new TokenMessage(MessageAction.CreateToken);
            tokenMessage.setDocument(createdToken);
            await messageServer.sendMessage(tokenMessage);
            // #endregion

            // #region Set token in document
            const stateData: IPolicyEventState = this.state[user.id].data;
            const docs: IPolicyDocument | IPolicyDocument[] = stateData.data;
            if (Array.isArray(docs)) {
                for (const doc of docs) {
                    if (!doc.tokens) {
                        doc.tokens = {};
                    }
                    doc.tokens[ref.options.template] = createdToken.tokenId;
                }
            } else {
                if (!docs.tokens) {
                    docs.tokens = {};
                }
                docs.tokens[ref.options.template] = createdToken.tokenId;
            }

            delete this.state[user.id];
            await ref.saveState();
            // #endregion

            this.changeActive(user, true);
            ref.triggerEvents(PolicyOutputEventType.RunEvent, user, stateData);
            ref.triggerEvents(PolicyOutputEventType.ReleaseEvent, user, null);
            ref.triggerEvents(PolicyOutputEventType.RefreshEvent, user, stateData);
            PolicyComponentsUtils.ExternalEventFn(new ExternalEvent(ExternalEventType.Set, ref, user, {
                tokenName: createdToken.tokenName,
                tokenSymbol: createdToken.tokenSymbol,
                tokenType: createdToken.tokenType,
                decimals: createdToken.decimals,
                initialSupply: createdToken.initialSupply,
                enableAdmin: createdToken.enableAdmin,
                enableFreeze: createdToken.enableFreeze,
                enableKYC: createdToken.enableKYC,
                enableWipe: createdToken.enableWipe
            }));
        } catch (error) {
            ref.error(`setData: ${PolicyUtils.getErrorMessage(error)}`);
            this.changeActive(user, true);
            throw new BlockActionError(error, ref.blockType, ref.uuid);
        }

        return {};
    }

    /**
     * Run block action
     * @event PolicyEventType.Run
     * @param {IPolicyEvent} event
     */
    @ActionCallback({
        output: [],
    })
    @CatchErrors()
    async runAction(event: IPolicyEvent<IPolicyEventState>) {
        const ref = PolicyComponentsUtils.GetBlockRef<IPolicyBlock>(this);
        ref.log(`runAction`);

        const user = event.user;
        const eventData = event.data;

        if (!this.state.hasOwnProperty(user.id)) {
            this.state[user.id] = {
                active: true,
                data: eventData
            };
        } else {
            this.state[user.id].data = eventData;
        }
        await ref.saveState();

        PolicyComponentsUtils.ExternalEventFn(new ExternalEvent(ExternalEventType.Run, ref, user, null));
    }
}
