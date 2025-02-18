import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/**
 * Dialog allowing you to select a file and load schemas.
 */
@Component({
    selector: 'set-version-dialog',
    templateUrl: './set-version-dialog.component.html',
    styleUrls: ['./set-version-dialog.component.css'],
})
export class SetVersionDialog {
    versionControl: FormControl = new FormControl('', [
        Validators.required,
        Validators.pattern(/^[\d]+([\\.][\d]+){0,2}$/),
    ]);

    constructor(
        public dialogRef: MatDialogRef<SetVersionDialog>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        
    }

    onNoClick(): void {
        this.dialogRef.close(null);
    }

    onSubmit(): void {
        this.dialogRef.close(this.versionControl.value);
    }

    get isPublishDisabled(): boolean {
        return !this.versionControl.valid;
    }
}
