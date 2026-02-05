import { ChangeDetectorRef, Component } from '@angular/core';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { RouterModule } from "@angular/router";
import { IUser, UserRole, UserService } from '../user/user';

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

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.userService.user$.subscribe(data => {
      this.user = data;
      this.cdr.detectChanges();
    });
  }

  protected login() {
    this.userService.login('', '');
  }

  protected logout() {
    this.userService.logout();
  }
};