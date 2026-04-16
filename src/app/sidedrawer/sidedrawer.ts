import { ChangeDetectorRef, Component } from '@angular/core';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { RouterModule } from "@angular/router";
import { IUser, User, UserRole, UserService } from '../user/user';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { SignInDialog, SignUpDialog } from '../user/signUpDialog';

@Component({
  selector: 'app-sidedrawer',
  imports: [FontAwesomeModule, RouterModule],
  templateUrl: './sidedrawer.html',
  styleUrl: './sidedrawer.css'
})
export class SideDrawer {

  static readonly name = "side-drawer";

  readonly userRole = UserRole;

  protected user: IUser = UserService.DefaultUser;

  protected get numActiveOrders(): number {
    return User.numActiveOrders(this.user);
  }

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.userService.user$.subscribe(data => {
      this.user = data;
      this.cdr.detectChanges();
    });
  }

  protected signUp() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = undefined;
    dialogConfig.height = "80%";

    const dialogRef = this.dialog.open(SignUpDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected login() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = undefined;
    dialogConfig.height = "90%";

    const dialogRef = this.dialog.open(SignInDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected logout() {
    this.userService.logout();
  }
};