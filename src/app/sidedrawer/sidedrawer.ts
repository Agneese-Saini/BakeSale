import { ChangeDetectorRef, Component } from '@angular/core';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { RouterModule } from "@angular/router";
import { IUser, User, UserRole, UserService } from '../user/user';
import { OrderHistory } from '../user/order-history';

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