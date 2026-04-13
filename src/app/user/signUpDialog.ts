import { ChangeDetectorRef, Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
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
    private userService: UserService,
    private cdr: ChangeDetectorRef) { }

  protected login() {
    this.userService.login('', '');
    this.dialogRef.close();
  }
}

@Component({
  imports: [FormsModule, FontAwesomeModule, MatDialogModule],
  templateUrl: './signUpDialog.html'
})
export class SignUpDialog {

  protected email?: string;
  protected emailError?: string;

}