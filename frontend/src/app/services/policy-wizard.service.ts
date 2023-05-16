import { Injectable } from '@angular/core';
import { BlockType } from '../modules/policy-engine/structures';
import { GenerateUUIDv4 } from '@guardian/interfaces';

export interface ISchemaRoleConfig {
    role: string;
    isApprover: boolean;
    approverRoleFor?: string;
    isCreator: boolean;
    gridColumns: { field: string; title: string }[];
}

export interface IWizardSchemaConfig {
    name: string;
    iri: string;
    isApproveEnable: boolean;
    isMintSchema: boolean;
    mintOptions: {
        tokenId: string;
        rule: string;
    };
    dependencySchemaIri: string;
    relationshipsSchemaIri: string;
    initialRolesFor: string[];
    rolesConfig: ISchemaRoleConfig[];
}

export interface IWizardTrustChainConfig {
    role: 'string';
    mintSchemaIri: string;
    viewOnlyOwnDocuments: boolean;
}

@Injectable()
export class PolicyWizardService {
    // public static sampleWizardIrecType: {
    //     roles: string[];
    //     schemas: IWizardSchemaConfig[];
    // } = {
    //     roles: ['Registrant', 'OWNER'],
    //     schemas: [
    //         {
    //             name: 'Organization',
    //             iri: '#f4a93fe3-47c5-4248-bb68-588d14eb5736',
    //             isApproveEnable: true,
    //             isMintSchema: false,
    //             mintOptions: {
    //                 tokenId: '',
    //                 rule: '',
    //             },
    //             dependencySchemaIri: '',
    //             relationshipsSchemaIri: '',
    //             initialRolesFor: ['Registrant'],
    //             rolesConfig: {
    //                 OWNER: {
    //                     isApprover: true,
    //                     approverRoleFor: 'Registrant',
    //                     isCreator: false,
    //                     gridColumns: [],
    //                 },
    //             },
    //         },
    //         {
    //             name: 'Device',
    //             iri: '#97ae1b9a-60c5-4221-8482-9ba9ef5b54c1',
    //             isApproveEnable: true,
    //             isMintSchema: false,
    //             mintOptions: {
    //                 tokenId: '',
    //                 rule: '',
    //             },
    //             dependencySchemaIri: '#87906161-2399-48f0-bc47-c2b0204247d2',
    //             relationshipsSchemaIri: '#f4a93fe3-47c5-4248-bb68-588d14eb5736',
    //             initialRolesFor: [],
    //             rolesConfig: {
    //                 OWNER: {
    //                     isApprover: true,
    //                     isCreator: false,
    //                     gridColumns: [],
    //                 },
    //                 Registrant: {
    //                     isApprover: false,
    //                     isCreator: true,
    //                     gridColumns: [],
    //                 },
    //             },
    //         },
    //         {
    //             name: 'Report',
    //             iri: '#87906161-2399-48f0-bc47-c2b0204247d2',
    //             isApproveEnable: true,
    //             isMintSchema: true,
    //             mintOptions: {
    //                 tokenId: '94462ff6-b533-46d7-8f65-5608db1298f0',
    //                 rule: '1',
    //             },
    //             dependencySchemaIri: '',
    //             relationshipsSchemaIri: '',
    //             initialRolesFor: [],
    //             rolesConfig: {
    //                 OWNER: {
    //                     isApprover: true,
    //                     isCreator: false,
    //                     gridColumns: [],
    //                 },
    //                 Registrant: {
    //                     isApprover: false,
    //                     isCreator: true,
    //                     gridColumns: [],
    //                 },
    //             },
    //         },
    //     ],
    //     // trustChain: {
    //     //     // OWNER: {
    //     //     //     viewAll: true,
    //     //     //     mintSchemaIri: '#87906161-2399-48f0-bc47-c2b0204247d2',
    //     //     // },
    //     // },
    // };

    blockCounter: number = 0;

    createPolicyConfig(
        root: any,
        wizardConfig: {
            roles: string[];
            schemas: IWizardSchemaConfig[];
            trustChain: IWizardTrustChainConfig[];
        }
    ): any {
        this.blockCounter = 0;
        const { roles, schemas, trustChain } = wizardConfig;
        // Add choose role block
        root.children = [this.getChooseRoleBlock(roles)];
        // Get link on children
        const children = root.children;
        // Create role containers
        const roleContainers: any = {};
        roles.forEach((role) => {
            roleContainers[role] = this.getRoleContainer(role);
        });

        // Put schemas tabs into role containers
        const initialApproveButtonTags: any = {};

        const roleTabContainers: any = {};

        // Create inital schema steps
        for (const schema of schemas) {
            for (const roleInitialSchemaFor of schema.initialRolesFor) {
                const tabsContainer = roleContainers[roleInitialSchemaFor];
                const stepContainer = this.getRoleStep(roleInitialSchemaFor);
                roleContainers[roleInitialSchemaFor] = stepContainer;
                stepContainer.children.push(tabsContainer);

                let [_, approveBtnTag, rejectBtnTag] =
                    this.createInitialSchemaSteps(
                        roleInitialSchemaFor,
                        stepContainer,
                        schema
                    );

                roleTabContainers[roleInitialSchemaFor] = roleTabContainers[
                    roleInitialSchemaFor
                ]
                    ? roleTabContainers[roleInitialSchemaFor]
                    : {};
                roleTabContainers[roleInitialSchemaFor] = tabsContainer;

                initialApproveButtonTags[schema.iri] = initialApproveButtonTags[
                    schema.iri
                ]
                    ? initialApproveButtonTags[schema.iri]
                    : {};
                initialApproveButtonTags[schema.iri][roleInitialSchemaFor] = {
                    approveBtnTag,
                    rejectBtnTag,
                };
            }
        }

        for (const schema of schemas) {
            for (const roleConfig of schema.rolesConfig) {
                const roleSchemaTabContainer =
                    this.putSchemasStepsIntoContainer(
                        roleConfig.role,
                        roleConfig,
                        schema,
                        schemas,
                        this.getTabContainer(roleConfig.role, schema.name),
                        initialApproveButtonTags[schema.iri] &&
                            initialApproveButtonTags[schema.iri][
                                roleConfig.approverRoleFor || ''
                            ]?.approveBtnTag,
                        initialApproveButtonTags[schema.iri] &&
                            initialApproveButtonTags[schema.iri][
                                roleConfig.approverRoleFor || ''
                            ]?.rejectBtnTag
                    );

                if (roleTabContainers[roleConfig.role]) {
                    roleTabContainers[roleConfig.role].children.push(
                        roleSchemaTabContainer
                    );
                } else {
                    roleContainers[roleConfig.role].children.push(
                        roleSchemaTabContainer
                    );
                }
            }
        }
        // Put trustchain items
        for (const trustChainConfig of trustChain) {
            const [roleTrustChainTabContainer, trustChainTag] =
                this.putTrustChainStepsIntoContainer(
                    trustChainConfig.role,
                    trustChainConfig,
                    schemas,
                    this.getTabContainer(trustChainConfig.role, 'Trust Chain')
                );
            const vpGridTabContainer = this.createVPGrid(
                trustChainConfig.role,
                trustChainConfig,
                trustChainTag,
                this.getTabContainer(trustChainConfig.role, 'Token History')
            );
            roleContainers[trustChainConfig.role].children.push(
                vpGridTabContainer,
                roleTrustChainTabContainer
            );
        }

        // Put all role containers to children of root
        for (const roleContainer of Object.values(roleContainers)) {
            children.push(roleContainer);
        }
    }

    createInitialSchemaSteps(
        role: string,
        container: any,
        schemaConfig: IWizardSchemaConfig
    ) {
        const requestDocument = this.getRequestDocumentBlock(
            role,
            schemaConfig.iri
        );
        const sendBlock = this.getDocumentSendBlock(
            role,
            false,
            schemaConfig.isApproveEnable
        );

        let approveBtnTag;
        if (schemaConfig.isApproveEnable) {
            const infoBlock = this.getInfoBlock(
                role,
                'Submitted to approve',
                'The page will be automatically refreshed'
            );
            const sendApproveBlock = this.getDocumentApproveSendBlock(role);
            const reassignBlock = this.getReassignBlock(role, true);
            const sendApproveReassignBlock = this.getDocumentSendBlock(
                role,
                false,
                false,
                'approved_entity'
            );
            approveBtnTag = sendApproveBlock.tag;
            container.children?.unshift(
                infoBlock,
                sendApproveBlock,
                reassignBlock,
                sendApproveReassignBlock
            );
        }

        container.children?.unshift(requestDocument, sendBlock);

        let rejectBtnTag;
        if (schemaConfig.isApproveEnable) {
            const rejectApproveBlock = this.getDocumentApproveSendBlock(role);
            container.children?.push(rejectApproveBlock);
            const reassignBlock = this.getReassignBlock(role, true);
            container.children?.push(reassignBlock);
            const sendRejectReassignBlock = this.getDocumentSendBlock(
                role,
                false,
                false,
                'rejected_entity'
            );
            rejectBtnTag = rejectApproveBlock.tag;
            container.children?.push(sendRejectReassignBlock);
            container.children?.push(
                this.getInfoBlock(role, 'Rejected', 'Document was rejected')
            );
        }

        return [container, approveBtnTag, rejectBtnTag];
    }

    putSchemasStepsIntoContainer(
        role: string,
        roleConfig: ISchemaRoleConfig,
        schemaConfig: IWizardSchemaConfig,
        schemaConfigs: IWizardSchemaConfig[],
        container: any,
        approveBtnTag?: string,
        rejectBtnTag?: string
    ) {
        const isSchemaDepended = schemaConfigs.find(
            (schema) => schema.dependencySchemaIri === schemaConfig.iri
        );
        const dependencySchema = schemaConfigs.find(
            (schema) => schema.iri === schemaConfig.dependencySchemaIri
        );
        const gridBlock = this.getDocumentsGrid(role, roleConfig.gridColumns);

        let createDependencySchemaAddonTag;
        if (schemaConfig.isApproveEnable) {
            if (roleConfig.isApprover) {
                const toApproveOrRejectAddon =
                    this.getDocumentsToApproveOrRejectSourceAddon(
                        role,
                        schemaConfig.iri
                    );
                const approvedAddon = this.getDocumentsApprovedSourceAddon(
                    role,
                    schemaConfig.iri
                );
                createDependencySchemaAddonTag = approvedAddon.tag;
                gridBlock?.children?.push(
                    toApproveOrRejectAddon,
                    approvedAddon
                );

                const saveDocumentApprove =
                    this.getDocumentApproveSendBlock(role);
                const saveDocumentReject =
                    this.getDocumentRejectSendBlock(role);

                const buttonsBlock = this.getApproveRejectButtonsBlock(
                    role,
                    approveBtnTag || saveDocumentApprove.tag,
                    rejectBtnTag || saveDocumentReject.tag
                );
                const approveRejectField = this.getApproveRejectField(
                    buttonsBlock.tag,
                    toApproveOrRejectAddon.tag
                );

                gridBlock.uiMetaData.fields.push(approveRejectField);
                container.children?.push(gridBlock, buttonsBlock);
                if (!approveBtnTag && !rejectBtnTag) {
                    container.children?.push(
                        saveDocumentApprove,
                        this.getReassignBlock(role),
                        this.getDocumentSendBlock(
                            role,
                            !schemaConfig.isMintSchema,
                            false,
                            'approved_entity'
                        )
                    );
                    if (schemaConfig.isMintSchema) {
                        container.children?.push(
                            this.getMintBlock(
                                role,
                                schemaConfig.mintOptions.tokenId,
                                schemaConfig.mintOptions.rule
                            )
                        );
                    }
                    container.children?.push(
                        saveDocumentReject,
                        this.getReassignBlock(role),
                        this.getDocumentSendBlock(
                            role,
                            true,
                            false,
                            'rejected_entity'
                        )
                    );
                }
            } else {
                const toApproveOrRejectAddon =
                    this.getDocumentsToApproveOrRejectSourceAddon(
                        role,
                        schemaConfig.iri,
                        true
                    );
                const approvedAddon = this.getDocumentsApprovedSourceAddon(
                    role,
                    schemaConfig.iri,
                    true
                );
                createDependencySchemaAddonTag = approvedAddon.tag;
                gridBlock?.children?.push(
                    toApproveOrRejectAddon,
                    approvedAddon
                );
                container.children?.push(gridBlock);
            }
        } else {
            const documentsSourceAddon = this.getDocumentsSourceAddon(
                role,
                schemaConfig.iri
            );
            createDependencySchemaAddonTag = documentsSourceAddon.tag;
            gridBlock?.children?.push(documentsSourceAddon);
            container.children?.push(gridBlock);
        }

        if (roleConfig.isCreator) {
            // && !isSchemaDepended
            if (schemaConfig.isApproveEnable) {
                const requestDocumentBlock = this.getDialogRequestDocumentBlock(
                    role,
                    schemaConfig.iri
                );
                container.children?.push(requestDocumentBlock);
                if (
                    schemaConfig.relationshipsSchemaIri &&
                    !schemaConfig.dependencySchemaIri
                ) {
                    container.children?.push(
                        this.getSetRelationshipsBlock(
                            role,
                            schemaConfig.relationshipsSchemaIri,
                            schemaConfig.isApproveEnable
                        )
                    );
                }
                container.children?.push(
                    this.getDocumentSendBlock(role, true, true)
                );
            } else {
                const requestDocumentBlock = this.getDialogRequestDocumentBlock(
                    role,
                    schemaConfig.iri
                );
                container.children?.push(requestDocumentBlock);
                if (
                    schemaConfig.relationshipsSchemaIri &&
                    !schemaConfig.dependencySchemaIri
                ) {
                    container.children?.push(
                        this.getSetRelationshipsBlock(
                            role,
                            schemaConfig.relationshipsSchemaIri,
                            schemaConfig.isApproveEnable
                        )
                    );
                }
                container.children?.push(
                    this.getDocumentSendBlock(
                        role,
                        !schemaConfig.isMintSchema,
                        true
                    )
                );

                if (
                    !schemaConfig.isApproveEnable &&
                    schemaConfig.isMintSchema
                ) {
                    container.children?.push(
                        this.getMintBlock(
                            role,
                            schemaConfig.mintOptions.tokenId,
                            schemaConfig.mintOptions.rule
                        )
                    );
                }
            }
            if (dependencySchema && createDependencySchemaAddonTag) {
                const requestDocumentBlock = this.getDialogRequestDocumentBlock(
                    role,
                    dependencySchema.iri,
                    true
                );
                container.children?.push(
                    requestDocumentBlock,
                    this.getDocumentSendBlock(
                        role,
                        !dependencySchema.isMintSchema,
                        dependencySchema.isApproveEnable
                    )
                );

                if (
                    !dependencySchema.isApproveEnable &&
                    dependencySchema.isMintSchema
                ) {
                    container.children?.push(
                        this.getMintBlock(
                            role,
                            dependencySchema.mintOptions.tokenId,
                            dependencySchema.mintOptions.rule
                        )
                    );
                }
                gridBlock.uiMetaData.fields.push(
                    this.getCreateDependencySchemaColumn(
                        `Create ${dependencySchema.name}`,
                        requestDocumentBlock.tag,
                        createDependencySchemaAddonTag
                    )
                );
            }
        }
        return container;
    }

    createVPGrid(
        role: string,
        trustChainConfig: IWizardTrustChainConfig,
        trustChainTag: string,
        container: any
    ) {
        const vpGrid = this.getVpGrid(
            role,
            trustChainTag,
            !trustChainConfig.viewOnlyOwnDocuments
        );
        container.children.push(vpGrid);
        return container;
    }

    putTrustChainStepsIntoContainer(
        role: string,
        trustChainConfig: IWizardTrustChainConfig,
        schemaConfig: IWizardSchemaConfig[],
        container: any
    ): [tabContainer: any, trustChainBlockTag: string] {
        const findRelatedSchemas = (
            iri: string,
            result: IWizardSchemaConfig[] = []
        ) => {
            const currentSchema = schemaConfig.find((item) => item.iri === iri);
            const dependencySchema = schemaConfig.find(
                (item) => item.dependencySchemaIri === iri
            );
            const relationShipSchema = schemaConfig.find(
                (item) => item.iri === currentSchema?.relationshipsSchemaIri
            );
            if (dependencySchema && dependencySchema.iri !== iri) {
                result.push(dependencySchema);
                findRelatedSchemas(dependencySchema.iri, result);
            }
            if (relationShipSchema && relationShipSchema.iri !== iri) {
                result.push(relationShipSchema);
                findRelatedSchemas(relationShipSchema.iri, result);
            }
            return result;
        };

        const reportBlock = this.getReportBlock(role);
        const mintReportItem = this.getReportMintItem(role);
        reportBlock.children.push(mintReportItem);
        const mintSchema = schemaConfig.find(
            (item) => item.iri === trustChainConfig.mintSchemaIri
        );

        let relationshipsVariableName = '';
        if (mintSchema?.isApproveEnable) {
            let firstReportItemApproved, firstReportItemCreated;
            [firstReportItemApproved, relationshipsVariableName] =
                this.getReportFirstItem(
                    role,
                    `${mintSchema.name} approved`,
                    `${mintSchema.name} approved`
                );
            [firstReportItemCreated, relationshipsVariableName] =
                this.getReportItem(
                    role,
                    `${mintSchema.name} created`,
                    `${mintSchema.name} created`,
                    relationshipsVariableName
                );
            reportBlock.children.push(
                firstReportItemApproved,
                firstReportItemCreated
            );
        } else {
            let firstReportItemCreated;
            [firstReportItemCreated, relationshipsVariableName] =
                this.getReportFirstItem(
                    role,
                    `${mintSchema?.name} created`,
                    `${mintSchema?.name} created`
                );
            reportBlock.children.push(firstReportItemCreated);
        }

        const relatedSchemas = findRelatedSchemas(mintSchema?.iri || '');
        for (const relatedSchema of relatedSchemas) {
            if (relatedSchema?.isApproveEnable) {
                let reportItemApproved, reportItemCreated;
                [reportItemApproved, relationshipsVariableName] =
                    this.getReportItem(
                        role,
                        `${relatedSchema.name} approved`,
                        `${relatedSchema.name} approved`,
                        relationshipsVariableName
                    );
                [reportItemCreated, relationshipsVariableName] =
                    this.getReportItem(
                        role,
                        `${relatedSchema.name} created`,
                        `${relatedSchema.name} created`,
                        relationshipsVariableName
                    );
                reportBlock.children.push(
                    reportItemApproved,
                    reportItemCreated
                );
            } else {
                let reportItemCreated;
                [reportItemCreated, relationshipsVariableName] =
                    this.getReportFirstItem(
                        role,
                        `${relatedSchema?.name} created`,
                        `${relatedSchema?.name} created`
                    );
                reportBlock.children.push(reportItemCreated);
            }
        }

        container.children.push(reportBlock);
        return [container, reportBlock.tag];
    }

    generateBlockTag() {
        this.blockCounter++;
        return 'Block_' + this.blockCounter;
    }

    getChooseRoleBlock(roles: string[]) {
        return {
            id: GenerateUUIDv4(),
            tag: this.generateBlockTag(),
            roles: roles?.filter((role) => role !== 'OWNER'),
            blockType: BlockType.PolicyRoles,
            defaultActive: true,
            children: [],
            permissions: ['NO_ROLE'],
            events: [],
            artifacts: [],
            uiMetaData: {
                title: 'Choose role',
                description: 'Please select your role',
            },
        };
    }

    getRoleContainer(role: string) {
        return {
            id: GenerateUUIDv4(),
            tag: this.generateBlockTag(),
            blockType: BlockType.Container,
            defaultActive: true,
            children: [],
            permissions: [role],
            events: [],
            artifacts: [],
            uiMetaData: {
                type: 'tabs',
            },
        };
    }

    getRoleStep(role: string) {
        return {
            id: GenerateUUIDv4(),
            tag: this.generateBlockTag(),
            blockType: BlockType.Step,
            defaultActive: true,
            children: [] as any,
            permissions: [role],
            events: [],
            artifacts: [],
        };
    }

    getTabContainer(role: string, title: string) {
        return {
            id: GenerateUUIDv4(),
            tag: this.generateBlockTag(),
            blockType: BlockType.Container,
            defaultActive: true,
            children: [] as any,
            permissions: [role],
            events: [],
            artifacts: [],
            uiMetaData: {
                type: 'blank',
                title,
            },
        };
    }

    getDocumentsGrid(role: string, fieldsConfig: any[]) {
        return {
            id: GenerateUUIDv4(),
            blockType: 'interfaceDocumentsSourceBlock',
            defaultActive: true,
            permissions: [role],
            onErrorAction: 'no-action',
            uiMetaData: {
                fields: [
                    ...fieldsConfig.map((fieldConfig) =>
                        Object({
                            name:
                                'document.credentialSubject.0.' +
                                fieldConfig.field,
                            title: fieldConfig.title,
                            type: 'text',
                        })
                    ),
                    {
                        name: 'document',
                        title: 'Document',
                        tooltip: '',
                        type: 'button',
                        action: 'dialog',
                        content: 'View Document',
                        uiClass: 'link',
                        dialogContent: 'VC',
                        dialogClass: '',
                        dialogType: 'json',
                    },
                ],
            },
            tag: this.generateBlockTag(),
            children: [
                {
                    id: GenerateUUIDv4(),
                    blockType: BlockType.HistoryAddon,
                    defaultActive: false,
                    permissions: [role],
                    onErrorAction: 'no-action',
                    tag: this.generateBlockTag(),
                },
            ] as any,
        };
    }

    getDocumentApproveSendBlock(role: string) {
        return {
            id: GenerateUUIDv4(),
            blockType: BlockType.SendToGuardian,
            defaultActive: false,
            permissions: [role],
            onErrorAction: 'no-action',
            uiMetaData: {},
            options: [
                {
                    name: 'status',
                    value: 'Approved',
                },
            ],
            stopPropagation: false,
            dataSource: 'database',
            documentType: 'vc',
            tag: this.generateBlockTag(),
        };
    }

    getDocumentRejectSendBlock(role: string) {
        return {
            id: GenerateUUIDv4(),
            blockType: BlockType.SendToGuardian,
            defaultActive: false,
            permissions: [role],
            onErrorAction: 'no-action',
            uiMetaData: {},
            options: [
                {
                    name: 'status',
                    value: 'Reject',
                },
            ],
            stopPropagation: false,
            dataSource: 'database',
            documentType: 'vc',
            tag: this.generateBlockTag(),
        };
    }

    getDocumentSendBlock(
        role: string,
        stopPropagation: boolean = false,
        needApprove: boolean = false,
        entityType?: string,
        inputRunEventsTags?: string,
        buttonIndex?: number
    ) {
        const newTag = this.generateBlockTag();
        return {
            id: GenerateUUIDv4(),
            blockType: BlockType.SendToGuardian,
            defaultActive: false,
            permissions: [role],
            onErrorAction: 'no-action',
            uiMetaData: {},
            options: needApprove
                ? [
                      {
                          name: 'status',
                          value: 'Waiting for approval',
                      },
                  ]
                : [],
            dataSource: 'auto',
            documentType: 'vc',
            tag: this.generateBlockTag(),
            stopPropagation,
            entityType,
            events: inputRunEventsTags
                ? [
                      {
                          target: newTag,
                          source: inputRunEventsTags,
                          input: 'RunEvent',
                          output: 'Button_' + buttonIndex,
                          actor: '',
                          disabled: false,
                      },
                  ]
                : [],
        };
    }

    getReassignBlock(role: string, actorIsOwner: boolean = false) {
        return {
            id: GenerateUUIDv4(),
            blockType: BlockType.ReassigningBlock,
            defaultActive: false,
            permissions: [role],
            onErrorAction: 'no-action',
            uiMetaData: {},
            issuer: '',
            actor: actorIsOwner ? 'owner' : '',
            tag: this.generateBlockTag(),
        };
    }

    getApproveRejectButtonsBlock(
        role: string,
        approveDocumentBlockTag: string,
        rejectDocumentBlockTag: string
    ) {
        const buttonBlockTag = this.generateBlockTag();
        return {
            id: GenerateUUIDv4(),
            blockType: BlockType.ButtonBlock,
            defaultActive: false,
            permissions: [role],
            onErrorAction: 'no-action',
            uiMetaData: {
                buttons: [
                    {
                        tag: 'Button_0',
                        name: 'Approve',
                        type: 'selector',
                        filters: [],
                        field: 'option.status',
                        value: 'Approved',
                        uiClass: 'btn-approve',
                    },
                    {
                        tag: 'Button_1',
                        name: 'Reject',
                        type: 'selector-dialog',
                        filters: [],
                        field: 'option.status',
                        value: 'Rejected',
                        uiClass: 'btn-reject',
                        title: 'Reject',
                        description: 'Enter reject reason',
                    },
                ],
            },
            tag: buttonBlockTag,
            events: [
                {
                    target: approveDocumentBlockTag,
                    source: buttonBlockTag,
                    input: 'RunEvent',
                    output: 'Button_0',
                    actor: '',
                    disabled: false,
                },
                {
                    target: rejectDocumentBlockTag,
                    source: buttonBlockTag,
                    input: 'RunEvent',
                    output: 'Button_1',
                    actor: '',
                    disabled: false,
                },
            ],
        };
    }

    getApproveRejectField(bindBlock: string, bindGroup: string) {
        return {
            title: 'Operation',
            name: 'option.status',
            tooltip: '',
            type: 'block',
            action: '',
            url: '',
            dialogContent: '',
            dialogClass: '',
            dialogType: '',
            bindBlock,
            width: '250px',
            bindGroup,
        };
    }

    // getOperationStatusColumn(role: string) {
    //     return {
    //         title: 'Operation',
    //         name: 'option.status',
    //         tooltip: '',
    //         type: 'text',
    //         width: '250px',
    //     };
    // }

    getDocumentsToApproveOrRejectSourceAddon(
        role: string,
        schema: string,
        onlyOwnDocuments: boolean = false
    ) {
        return {
            id: GenerateUUIDv4(),
            blockType: BlockType.DocumentsSourceAddon,
            defaultActive: false,
            permissions: [role],
            onErrorAction: 'no-action',
            filters: [
                {
                    value: 'Waiting for approval',
                    field: 'option.status',
                    type: 'equal',
                },
            ],
            dataType: 'vc-documents',
            schema,
            onlyOwnDocuments,
            tag: this.generateBlockTag(),
        };
    }

    getDocumentsApprovedSourceAddon(
        role: string,
        schema: string,
        onlyOwnDocuments: boolean = false
    ) {
        return {
            id: GenerateUUIDv4(),
            blockType: BlockType.DocumentsSourceAddon,
            defaultActive: false,
            permissions: [role],
            onErrorAction: 'no-action',
            filters: [
                {
                    value: 'approved_entity',
                    field: 'type',
                    type: 'equal',
                },
            ],
            dataType: 'vc-documents',
            schema,
            onlyOwnDocuments,
            tag: this.generateBlockTag(),
        };
    }

    getDocumentsSourceAddon(
        role: string,
        schema: string,
        onlyOwnDocuments: boolean = false
    ) {
        return {
            id: GenerateUUIDv4(),
            blockType: BlockType.DocumentsSourceAddon,
            defaultActive: false,
            permissions: [role],
            onErrorAction: 'no-action',
            filters: [],
            dataType: 'vc-documents',
            schema,
            onlyOwnDocuments,
            tag: this.generateBlockTag(),
        };
    }

    getDialogRequestDocumentBlock(
        role: string,
        schemaIri: string,
        dependencySchema: boolean = false,
        schemaName?: string
    ) {
        return {
            id: GenerateUUIDv4(),
            blockType: BlockType.Request,
            defaultActive: !dependencySchema,
            permissions: [role],
            onErrorAction: 'no-action',
            uiMetaData: {
                type: 'dialog',
                content: 'Create' + (schemaName ? ` ${schemaName}` : ''),
                dialogContent: 'Enter data',
                buttonClass: dependencySchema ? 'link' : '',
            },
            presetFields: [],
            idType: 'UUID',
            schema: schemaIri,
            // preset: !!presetSchemaIri,
            // presetSchema: presetSchemaIri,
            tag: this.generateBlockTag(),
        };
    }

    getRequestDocumentBlock(role: string, schemaIri: string) {
        return {
            id: GenerateUUIDv4(),
            blockType: BlockType.Request,
            defaultActive: true,
            permissions: [role],
            onErrorAction: 'no-action',
            uiMetaData: {
                type: 'page',
                title: 'Enter description',
            },
            schema: schemaIri,
            idType: 'UUID',
            tag: this.generateBlockTag(),
        };
    }

    getInfoBlock(role: string, title: string, description: string) {
        return {
            id: GenerateUUIDv4(),
            blockType: BlockType.Information,
            defaultActive: true,
            permissions: [role],
            onErrorAction: 'no-action',
            uiMetaData: {
                description,
                type: 'text',
                title,
            },
            stopPropagation: true,
            tag: this.generateBlockTag(),
        };
    }

    getReportBlock(role: string) {
        return {
            id: GenerateUUIDv4(),
            blockType: BlockType.Report,
            defaultActive: true,
            permissions: [role],
            onErrorAction: 'no-action',
            tag: this.generateBlockTag(),
            children: [] as any,
        };
    }

    getReportMintItem(role: string) {
        return {
            id: GenerateUUIDv4(),
            blockType: BlockType.ReportItem,
            defaultActive: false,
            permissions: [role],
            onErrorAction: 'no-action',
            filters: [
                {
                    type: 'equal',
                    typeValue: 'variable',
                    field: 'document.id',
                    value: 'actionId',
                },
            ],
            variables: [],
            visible: true,
            iconType: 'COMMON',
            title: 'Token',
            description: 'Token[s] minted.',
            dynamicFilters: [],
            tag: this.generateBlockTag(),
        };
    }

    getReportFirstItem(
        role: string,
        title: string,
        description: string
    ): [config: any, relationshipsVariableName: string] {
        const generatedVariableName = GenerateUUIDv4();
        return [
            {
                id: GenerateUUIDv4(),
                blockType: BlockType.ReportItem,
                defaultActive: false,
                permissions: [role],
                onErrorAction: 'no-action',
                filters: [
                    {
                        type: 'equal',
                        typeValue: 'variable',
                        field: 'document.id',
                        value: 'documentId',
                    },
                ],
                variables: [
                    {
                        name: generatedVariableName,
                        value: 'relationships',
                    },
                ],
                visible: true,
                iconType: 'COMMON',
                title,
                description,
                dynamicFilters: [],
                tag: this.generateBlockTag(),
            },
            generatedVariableName,
        ];
    }

    getReportItem(
        role: string,
        title: string,
        description: string,
        relationshipsVariableName: string
    ): [config: any, relationshipsVariableName: string] {
        const generatedVariableName = GenerateUUIDv4();
        return [
            {
                id: GenerateUUIDv4(),
                blockType: BlockType.ReportItem,
                defaultActive: false,
                permissions: [role],
                onErrorAction: 'no-action',
                filters: [
                    {
                        type: 'in',
                        typeValue: 'variable',
                        field: 'messageId',
                        value: relationshipsVariableName,
                    },
                ],
                variables: [
                    {
                        value: 'relationships',
                        name: generatedVariableName,
                    },
                ],
                visible: true,
                iconType: 'COMMON',
                title,
                description,
                dynamicFilters: [],
                tag: this.generateBlockTag(),
            },
            generatedVariableName,
        ];
    }

    getVpGrid(role: string, trustChainTag: string, viewAll: boolean) {
        return {
            id: GenerateUUIDv4(),
            blockType: BlockType.DocumentsViewer,
            defaultActive: true,
            permissions: [role],
            onErrorAction: 'no-action',
            uiMetaData: {
                fields: [
                    {
                        title: 'HASH',
                        name: 'hash',
                        tooltip: '',
                        type: 'text',
                    },
                    {
                        title: 'Date',
                        name: 'document.verifiableCredential.1.credentialSubject.0.date',
                        tooltip: '',
                        type: 'text',
                    },
                    {
                        title: 'Token Id',
                        name: 'document.verifiableCredential.1.credentialSubject.0.tokenId',
                        tooltip: '',
                        type: 'text',
                    },
                    {
                        title: 'Serials',
                        name: 'document.verifiableCredential.1.credentialSubject.0.serials',
                        tooltip: '',
                        type: 'text',
                    },
                    {
                        title: 'TrustChain',
                        name: 'hash',
                        tooltip: '',
                        type: 'button',
                        action: 'link',
                        url: '',
                        dialogContent: '',
                        dialogClass: '',
                        dialogType: '',
                        bindBlock: trustChainTag,
                        content: 'View TrustChain',
                        width: '150px',
                    },
                ],
            },
            tag: this.generateBlockTag(),
            children: [this.getVPSourceAddon(role, !viewAll)],
        };
    }

    getVPSourceAddon(role: string, onlyOwnDocuments: boolean) {
        return {
            id: GenerateUUIDv4(),
            blockType: BlockType.DocumentsSourceAddon,
            defaultActive: false,
            permissions: [role],
            onErrorAction: 'no-action',
            filters: [],
            dataType: 'vp-documents',
            tag: this.generateBlockTag(),
            onlyOwnDocuments,
        };
    }

    getMintBlock(role: string, tokenId: string, rule: string) {
        return {
            id: GenerateUUIDv4(),
            blockType: BlockType.Mint,
            stopPropagation: true,
            defaultActive: false,
            permissions: [role],
            onErrorAction: 'no-action',
            uiMetaData: {},
            tokenId,
            rule,
            accountType: 'default',
            tag: this.generateBlockTag(),
        };
    }

    getCreateDependencySchemaColumn(
        title: string,
        bindBlock: string,
        bindGroup: string
    ) {
        return {
            title,
            name: '',
            type: 'block',
            action: '',
            url: '',
            dialogContent: '',
            dialogClass: '',
            dialogType: '',
            bindBlock,
            width: '150px',
            bindGroup: bindGroup,
        };
    }

    getSetRelationshipsBlock(
        role: string,
        schemaIri: string,
        isApproveEnable: boolean
    ) {
        return {
            id: GenerateUUIDv4(),
            blockType: 'setRelationshipsBlock',
            defaultActive: false,
            permissions: [role],
            onErrorAction: 'no-action',
            includeAccounts: false,
            tag: this.generateBlockTag(),
            children: [
                isApproveEnable
                    ? this.getDocumentsApprovedSourceAddon(
                          role,
                          schemaIri,
                          true
                      )
                    : this.getDocumentsSourceAddon(role, schemaIri, true),
            ],
        };
    }
}
