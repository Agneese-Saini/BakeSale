import { ChangeDetectorRef, Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatDialog, MatDialogConfig, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { UserService } from "./user";

@Component({
  imports: [FormsModule, FontAwesomeModule, MatDialogModule],
  templateUrl: './signInDialog.html'
})
export class SignInDialog {
  
  protected email?: string;
  protected password?: string;
  protected error: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<SignInDialog>,
    private dialog: MatDialog,
    private userService: UserService,
    private cdr: ChangeDetectorRef) { }

  protected login() {
    this.userService.login('', '');
    this.dialogRef.close();
  }

  protected redirect() {
    this.dialogRef.close();
    
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = undefined;
    dialogConfig.height = "80%";

    const dialogRef = this.dialog.open(SignUpDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }
}

@Component({
  imports: [FormsModule, FontAwesomeModule, MatDialogModule],
  templateUrl: './signUpDialog.html'
})
export class SignUpDialog {
    
  protected email?: string;
  protected emailError?: string;

  constructor(
    private dialogRef: MatDialogRef<SignUpDialog>,
    private dialog: MatDialog,
    private userService: UserService,
    private cdr: ChangeDetectorRef) { }

  protected redirect() {
    this.dialogRef.close();
    
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = undefined;
    dialogConfig.height = "90%";

    const dialogRef = this.dialog.open(SignInDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }
}