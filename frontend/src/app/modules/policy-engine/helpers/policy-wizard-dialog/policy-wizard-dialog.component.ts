import {
    ChangeDetectorRef,
    Component,
    Inject,
    OnInit,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import {
    Validators,
    FormBuilder,
    FormControl,
    FormGroup,
    FormArray,
    AbstractControl,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Schema, SchemaField, Token } from '@guardian/interfaces';
import { Subject } from 'rxjs';
import { RetireTokenDialogComponent } from 'src/app/components/retire-token-dialog/retire-token-dialog.component';
import { SeparateStepperComponent } from '../separate-stepper/separate-stepper.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
    IWizardSchemaConfig,
    IWizardTrustChainConfig,
} from 'src/app/services/policy-wizard.service';

@Component({
    selector: 'app-policy-wizard-dialog',
    templateUrl: './policy-wizard-dialog.component.html',
    styleUrls: ['./policy-wizard-dialog.component.css'],
})
export class PolicyWizardDialogComponent implements OnInit {
    @ViewChild(SeparateStepperComponent) matTree!: SeparateStepperComponent;
    @ViewChild('policyDescriptionForm', { read: TemplateRef })
    policyDescriptionFormTemp: any;
    @ViewChild('policyRoles', { read: TemplateRef }) policyRoles: any;
    @ViewChild('policySchemas', { read: TemplateRef }) policySchemas: any;
    @ViewChild('schemaConfig', { read: TemplateRef }) schemaConfig: any;
    @ViewChild('schemaRoleConfig', { read: TemplateRef }) schemaRoleConfig: any;
    @ViewChild('trustChainConfig', { read: TemplateRef }) trustChainConfig: any;
    @ViewChild('trustChainRoleConfig', { read: TemplateRef })
    trustChainRoleConfig: any;

    tokens!: Token[];
    schemas!: Schema[];
    selectedSchemas: Schema[] = [];
    mintedSchemas: Schema[] = [];
    selectedTrustChainRoles: string[] = [];

    policyForm = this.fb.group({
        name: ['', Validators.required],
        description: [''],
        topicDescription: [''],
        policyTag: [`Tag_${Date.now()}`, Validators.required],
    });
    policyRolesForm = this.fb.control(['OWNER']);
    policySchemasForm = this.fb.array([]);
    trustChainForm = this.fb.array([]);

    dataForm: FormGroup = this.fb.group({
        policy: this.policyForm,
        roles: this.policyRolesForm,
        schemas: this.policySchemasForm,
        trustChain: this.trustChainForm,
    });

    treeData: any;

    currentNode: any;

    destroy$: Subject<boolean> = new Subject<boolean>();

    preset: any;
    // sampleConfig: any = {
    //     policy: {
    //         name: 'test123',
    //         description: 'test2',
    //         topicDescription: 'test1',
    //     },
    //     roles: ['reg'],
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
    //             dependencySchemaIri: '#f4a93fe3-47c5-4248-bb68-588d14eb5736',
    //             relationshipsSchemaIri: '#f4a93fe3-47c5-4248-bb68-588d14eb5736',
    //             initialRolesFor: ['OWNER', 'reg'],
    //             rolesConfig: [
    //                 {
    //                     role: 'OWNER',
    //                     isApprover: false,
    //                     isCreator: false,
    //                     approverRoleFor: null,
    //                     gridColumns: [],
    //                 },
    //                 {
    //                     role: 'reg',
    //                     isApprover: false,
    //                     isCreator: false,
    //                     approverRoleFor: null,
    //                     gridColumns: [],
    //                 },
    //             ],
    //         },
    //         {
    //             name: 'Device',
    //             iri: '#97ae1b9a-60c5-4221-8482-9ba9ef5b54c1',
    //             isApproveEnable: false,
    //             isMintSchema: false,
    //             mintOptions: {
    //                 tokenId: '',
    //                 rule: '',
    //             },
    //             dependencySchemaIri: '',
    //             relationshipsSchemaIri: '',
    //             initialRolesFor: [],
    //             rolesConfig: [],
    //         },
    //         {
    //             name: 'Report',
    //             iri: '#87906161-2399-48f0-bc47-c2b0204247d2',
    //             isApproveEnable: false,
    //             isMintSchema: true,
    //             mintOptions: {
    //                 tokenId: 'f36208d0-1fe1-40ce-aded-5bcfeecd0958',
    //                 rule: 'field0',
    //             },
    //             dependencySchemaIri: '',
    //             relationshipsSchemaIri: '',
    //             initialRolesFor: [],
    //             rolesConfig: [],
    //         },
    //     ],
    //     trustChain: [
    //         {
    //             role: 'OWNER',
    //             viewAll: true,
    //             mintSchemaIri: '#87906161-2399-48f0-bc47-c2b0204247d2',
    //         },
    //         {
    //             role: 'reg',
    //             viewAll: false,
    //             mintSchemaIri: '#87906161-2399-48f0-bc47-c2b0204247d2',
    //         },
    //     ],
    // };

    constructor(
        public dialogRef: MatDialogRef<RetireTokenDialogComponent>,
        private fb: FormBuilder,
        private cdRef: ChangeDetectorRef,
        @Inject(MAT_DIALOG_DATA)
        public data: {
            schemas: Schema[];
            [key: string]: any;
        }
    ) {
        if (data?.policyDataForm) {
            this.policyForm.patchValue(data.policyDataForm);
            this.policyForm.get('policyTag')?.disable();
        }
        if (data?.schemas) {
            this.schemas = data?.schemas;
        }
        if (data?.tokens) {
            this.tokens = data?.tokens;
        }
        if (data?.state) {
            try {
                this.preset = JSON.parse(data?.state);
            } catch {}
        }
    }

    ngAfterViewInit() {
        const schemasNode = {
            id: '3',
            name: 'Policy Schemas',
            template: this.policySchemas,
            icon: 'description',
            children: [],
        };
        const trustChainNode = {
            id: '4',
            name: 'Trust Chain',
            control: this.trustChainForm,
            template: this.trustChainConfig,
            icon: 'link',
            children: [],
        };
        this.treeData = {
            name: 'Wizard Configuration',
            children: [
                {
                    id: '1',
                    name: 'Policy Description',
                    template: this.policyDescriptionFormTemp,
                    control: this.policyForm,
                    icon: 'settings',
                    children: [],
                },
                {
                    id: '2',
                    name: 'Policy Roles',
                    control: this.policyRolesForm,
                    template: this.policyRoles,
                    icon: 'groups',
                    children: [],
                },
                schemasNode,
                trustChainNode,
            ],
        };
        this.setParents(this.treeData);
        this.currentNode = this.treeData.children[0];
        if (this.preset) {
            this.loadData(
                this.preset.data,
                schemasNode,
                trustChainNode,
                this.preset.currentNode
            );
        }
        this.cdRef.detectChanges();
    }

    loadData(
        data: {
            policy: any;
            roles: string[];
            schemas: IWizardSchemaConfig[];
            trustChain: IWizardTrustChainConfig[];
        },
        schemasNode: any,
        trustChainNode: any,
        currentNodeId?: string
    ) {
        if (!data) {
            return;
        }
        if (data.schemas) {
            const selectedSchemasIris = data.schemas.map((item) => item.iri);
            this.selectedSchemas = this.schemas.filter((item) =>
                selectedSchemasIris.includes(item.iri as any)
            );
            for (const schemaConfig of data.schemas) {
                const schema: any = this.schemas.find(
                    (item) => item.iri === schemaConfig.iri
                );
                const schemaNode: any = this.onSelectedSchemaChange(
                    schema,
                    schemasNode,
                    schemaConfig.rolesConfig.map((item) => item.role)
                );
                for (const roleConfig of schemaConfig.rolesConfig) {
                    const schemaRoleConfigControl = schemaNode.control.get(
                        'rolesConfig'
                    ) as FormArray;
                    const initialRolesForControl: any =
                        schemaNode.control.get('initialRolesFor');

                    const isApproveEnableControl: any =
                        schemaNode.control.get('isApproveEnable');
                    const dependencySchemaControl: any = schemaNode.control.get(
                        'dependencySchemaIri'
                    );
                    this.onSchemaRoleConfigChange(
                        roleConfig.role,
                        schema.fields,
                        schemaRoleConfigControl,
                        initialRolesForControl,
                        isApproveEnableControl,
                        dependencySchemaControl,
                        schemaNode
                    );
                }
            }
        }
        if (data.trustChain) {
            this.selectedTrustChainRoles = data.trustChain.map(
                (item) => item.role
            );
            for (const trustChainConfig of data.trustChain) {
                this.onSelectedTrustChainRoleChange(
                    trustChainConfig.role,
                    trustChainNode
                );
            }
        }
        this.dataForm.patchValue(data);
        const currentNode = this.findCurrentNode(
            this.treeData,
            currentNodeId?.split('.')
        );
        if (currentNode && currentNode !== this.treeData) {
            this.currentNode = currentNode;
        }
    }

    findCurrentNode(node: any, indexes: string[] = []) {
        let result = node;

        for (const index of indexes) {
            result = result.children[+index - 1];
        }

        return result;
    }

    setParents(root: any) {
        root.children?.forEach((child: any) => {
            child.parent = root;
            this.setParents(child);
        });
    }

    ngOnInit() {}

    onSchemaRolesConfigChange(
        schemaConfigControl: FormGroup,
        roles: string[],
        fields: any[],
        options: any
    ) {
        const schemaRoleConfigControl = schemaConfigControl.get(
            'rolesConfig'
        ) as FormArray;
        const deletedRoles = options.displayedInRoles.filter(
            (displayedRole: any) => !roles.includes(displayedRole)
        );
        this.currentNode.children =
            this.currentNode.children.filter(
                (roleSchemaNode: any) =>
                    !deletedRoles.find(
                        (deletedRole: string) =>
                            roleSchemaNode.role === deletedRole
                    )
            ) || [];
        this.deleteControlsFromFormArray(
            schemaRoleConfigControl,
            schemaRoleConfigControl.controls.filter((control) =>
                deletedRoles.find(
                    (deletedRole: string) => control.value?.role === deletedRole
                )
            )
        );

        const addedRoles = roles.filter(
            (existingRole: any) =>
                !options.displayedInRoles.includes(existingRole)
        );
        const initialRolesForControl: any =
            schemaConfigControl.get('initialRolesFor');

        const isApproveEnableControl: any =
            schemaConfigControl.get('isApproveEnable');
        const dependencySchemaControl: any = schemaConfigControl.get(
            'dependencySchemaIri'
        );
        for (const role of addedRoles) {
            this.onSchemaRoleConfigChange(
                role,
                fields,
                schemaRoleConfigControl,
                initialRolesForControl,
                isApproveEnableControl,
                dependencySchemaControl,
                this.currentNode
            );
        }

        options.displayedInRoles = roles;
        this.matTree.refreshTree();
    }

    onSchemaRoleConfigChange(
        role: string,
        fields: SchemaField[],
        schemaRoleConfigControl: FormArray,
        initialRolesForControl: FormControl,
        isApproveEnableControl: FormControl,
        dependencySchemaControl: FormControl,
        node: any
    ) {
        const dependencySchema = this.selectedSchemas.find(
            (item) => item.iri === dependencySchemaControl?.value
        );
        const newNode: any = {
            id: `${node.id}.${node.children.length + 1}`,
            icon: node.icon,
            name: `${role} configuration`,
            parent: node,
            template: this.schemaRoleConfig,
            fields,
            initialSchemaFor: initialRolesForControl?.value,
            approveEnable: isApproveEnableControl?.value,
            dependencySchema: dependencySchema?.name,
            role,
        };
        const dependencySchemaListener =
            dependencySchemaControl?.valueChanges.subscribe((iri) => {
                newNode.dependencySchema = this.selectedSchemas.find(
                    (item) => item.iri === iri
                )?.name;
            });
        const isApproveEnableListener =
            isApproveEnableControl?.valueChanges.subscribe((value) => {
                newNode.approveEnable = value;
            });

        const initialRolesForListener =
            initialRolesForControl?.valueChanges.subscribe((value) => {
                newNode.initialSchemaFor = value;
            });
        const schemaRoleConfigForm = this.fb.group({
            role: [role],
            isApprover: [false],
            isCreator: [false],
            approverRoleFor: [],
            gridColumns: [[]],
        });
        schemaRoleConfigControl.push(schemaRoleConfigForm);
        newNode.control = schemaRoleConfigForm;
        node.children.push(newNode);

        const sub = this.policyRolesForm.valueChanges.subscribe((value) => {
            if (!value.includes(role) && role !== 'OWNER') {
                node.children.splice(node.children.indexOf(newNode), 1);
                this.deleteControlsFromFormArray(
                    schemaRoleConfigControl,
                    schemaRoleConfigControl.controls.filter(
                        (control) => control === schemaRoleConfigForm
                    )
                );
                node.options.displayedInRoles =
                    node.options.displayedInRoles.filter(
                        (displayedRole: string) => value.includes(displayedRole)
                    );
                dependencySchemaListener.unsubscribe();
                isApproveEnableListener.unsubscribe();
                initialRolesForListener.unsubscribe();
                this.matTree.refreshTree();
                sub.unsubscribe();
            }
        });

        return newNode;
    }

    onNoClick(): void {
        this.dialogRef.close({
            create: false,
            currentNode: this.currentNode.id,
            config: this.dataForm.value,
        });
    }

    ngOnDestroy() {
        this.destroy$.next(true);
        this.destroy$.unsubscribe();
    }

    onAddRole(control: FormControl, name: string) {
        const selectedRoles: any[] = control?.value;
        if (!name || selectedRoles.indexOf(name) >= 0) {
            return;
        }
        selectedRoles?.push(name);
        control.updateValueAndValidity();
    }

    onRemoveRole(control: FormControl, name: string) {
        const array = control?.value;
        if (array.indexOf(name) >= 0 && name !== 'OWNER') {
            array?.splice(array.indexOf(name), 1);
            control.updateValueAndValidity();
        }
    }

    onAddColumn(title: string, field: string, gridColumns: any[]) {
        if (
            !title ||
            !field ||
            gridColumns.findIndex((item) => item.title === title) >= 0
        ) {
            return;
        }
        gridColumns.push({
            title,
            field,
        });
    }

    onRemoveColumn(title: string, gridColumns: any[]) {
        const array = gridColumns;
        if (array.findIndex((item) => item.title === title) >= 0) {
            array?.splice(
                array.findIndex((item) => item.title === title),
                1
            );
        }
    }

    onCreate() {
        if (!this.dataForm.valid) {
            return;
        }
        this.dialogRef.close({
            create: true,
            currentNode: this.currentNode.id,
            config: this.dataForm.value,
        });
    }

    onSelectedSchemasChange(value: any) {
        const deletedSchemas = this.selectedSchemas.filter(
            (schema) => !value.find((item: any) => item.iri === schema.iri)
        );
        this.currentNode.children =
            this.currentNode.children.filter(
                (schema: any) =>
                    !deletedSchemas.find(
                        (deletedSchema) =>
                            deletedSchema.iri === schema.schema.iri
                    )
            ) || [];
        this.deleteControlsFromFormArray(
            this.policySchemasForm,
            this.policySchemasForm.controls.filter((control) =>
                deletedSchemas.find(
                    (deletedSchema) => deletedSchema.iri === control.value?.iri
                )
            )
        );
        this.mintedSchemas =
            this.mintedSchemas.filter(
                (schema: any) =>
                    !deletedSchemas.find(
                        (deletedSchema) => deletedSchema.iri === schema.iri
                    )
            ) || [];
        [];

        const addedSchemas = value.filter(
            (item: any) =>
                !this.selectedSchemas.find((schema) => item.iri === schema.iri)
        );
        for (const schema of addedSchemas) {
            this.onSelectedSchemaChange(schema, this.currentNode);
        }

        this.selectedSchemas = value;
        this.matTree.refreshTree();
    }

    onSelectedSchemaChange(
        schema: Schema,
        node: any,
        displayedInRoles?: string[]
    ) {
        const mintControl = this.fb.control(false);
        mintControl.valueChanges.subscribe((value) => {
            if (value) {
                this.mintedSchemas.push(schema);
            } else {
                this.mintedSchemas.splice(
                    this.mintedSchemas.indexOf(schema),
                    1
                );
            }
        });
        const schemaConfigControl = this.fb.group({
            name: [schema.name],
            iri: [schema.iri],
            isApproveEnable: [false],
            isMintSchema: mintControl,
            mintOptions: this.fb.group({
                tokenId: [''],
                rule: [''],
            }),
            dependencySchemaIri: [''],
            relationshipsSchemaIri: [''],
            initialRolesFor: [[]],
            rolesConfig: this.fb.array([]),
        });
        this.policySchemasForm.push(schemaConfigControl);
        const newNode = {
            id: `${node.id}.${node.children.length + 1}`,
            icon: node.icon,
            name: `${schema.name} configuration`,
            children: [],
            parent: node,
            template: this.schemaConfig,
            schema,
            control: schemaConfigControl,
            options: {
                displayedInRoles: displayedInRoles || [],
            },
        };
        node.children.push(newNode);
        return newNode;
    }

    onSelectedTrustChainRolesChange(value: any) {
        const deletedRoles = this.selectedTrustChainRoles.filter(
            (displayedRole: any) => !value.includes(displayedRole)
        );
        this.currentNode.children =
            this.currentNode.children.filter(
                (roleSchemaNode: any) =>
                    !deletedRoles.find(
                        (deletedRole: string) =>
                            roleSchemaNode.role === deletedRole
                    )
            ) || [];

        const addedRoles = value.filter(
            (existingRole: any) =>
                !this.selectedTrustChainRoles.includes(existingRole)
        );
        for (const role of addedRoles) {
            this.onSelectedTrustChainRoleChange(role, this.currentNode);
        }

        this.selectedTrustChainRoles = value;
        this.matTree.refreshTree();
    }

    onSelectedTrustChainRoleChange(trustChainRole: string, node: any) {
        const trustChainRoleConfigControl = this.fb.group({
            role: [trustChainRole],
            viewOnlyOwnDocuments: [false],
            mintSchemaIri: [''],
        });
        this.trustChainForm.push(trustChainRoleConfigControl);
        const newNode = {
            id: `${node.id}.${node.children.length + 1}`,
            icon: node.icon,
            name: `${trustChainRole} configuration`,
            children: [],
            parent: node,
            template: this.trustChainRoleConfig,
            control: trustChainRoleConfigControl,
            role: trustChainRole,
        };
        node.children.push(newNode);

        const sub = this.policyRolesForm.valueChanges.subscribe((value) => {
            if (!value.includes(trustChainRole)) {
                node.children.splice(node.children.indexOf(newNode), 1);
                this.deleteControlsFromFormArray(
                    this.trustChainForm,
                    trustChainRoleConfigControl
                );
                this.selectedTrustChainRoles =
                    this.selectedTrustChainRoles.filter(
                        (displayedRole: string) => value.includes(displayedRole)
                    );
                this.matTree.refreshTree();
                sub.unsubscribe();
            }
        });
    }

    deleteControlsFromFormArray(
        arrayControl: FormArray,
        deleteItems: AbstractControl | AbstractControl[]
    ) {
        if (Array.isArray(deleteItems)) {
            for (const deleteItem of deleteItems) {
                arrayControl.removeAt(
                    arrayControl.controls.indexOf(deleteItem)
                );
            }
        } else {
            arrayControl.removeAt(arrayControl.controls.indexOf(deleteItems));
        }
    }

    drop(event: CdkDragDrop<any[]>, gridColumnsArray: any[]) {
        moveItemInArray(
            gridColumnsArray,
            event.previousIndex,
            event.currentIndex
        );
    }
}
