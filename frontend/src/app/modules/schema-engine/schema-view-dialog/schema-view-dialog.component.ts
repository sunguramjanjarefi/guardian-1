import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Dialog for preview schema.
 */
@Component({
    selector: 'app-schema-view-dialog',
    templateUrl: './schema-view-dialog.component.html',
    styleUrls: ['./schema-view-dialog.component.css']
})
export class SchemaViewDialog {
    loading = true;

    schemaType: string;
    schemas!: any[];
    topicId: any;
    policies: any[];
    modules: any[];
    tools: any[];

    constructor(
        public dialogRef: MatDialogRef<SchemaViewDialog>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        this.schemas = this.data.schemas || [];
        this.topicId = this.data.topicId || null;

        this.schemaType = data.schemaType || 'policy';
        this.policies = data.policies || [];
        this.modules = data.modules || [];
        this.tools = data.tools || [];
    }

    ngOnInit() {
        this.loading = false;
    }

    onClose(): void {
        this.dialogRef.close(false);
    }

    onImport() {
        this.dialogRef.close({ topicId: this.topicId });
    }

    onNewVersionClick(messageId: string) {
        this.dialogRef.close({ messageId });
    }
}