import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Router, RouterModule } from '@angular/router';
import { SideDrawer } from '../sidedrawer/sidedrawer';
import { CheckoutDrawer } from '../checkout/checkout-drawer';
import { IUser, User, UserRole, UserService } from '../user/user';
import { Logo } from '../header/header';

@Component({
  selector: 'home-header',
  imports: [FormsModule, FontAwesomeModule, RouterModule, Logo],
  templateUrl: './home-header.html'
})
export class HomeHeader {

  protected appDrawer = SideDrawer.name;
  protected checkoutDrawer = CheckoutDrawer.name;
  protected userRole = UserRole;

  protected user: IUser = UserService.DefaultUser;

  protected get numActiveOrders(): number {
    return User.numActiveOrders(this.user);
  }

  constructor(
    private router: Router,
    private userService: UserService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() { 
    this.userService.user$.subscribe(data => {
      this.user = data;
      this.cdr.detectChanges();
    });
  }

  protected onClickHome() {
    this.router.navigate(['/']);
  }
};