import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Router, RouterModule } from '@angular/router';
import { SideDrawer } from '../sidedrawer/sidedrawer';
import { CheckoutDrawer } from '../checkout/checkout-drawer';
import { HomeCategories, IUser, UserRole, UserService } from '../user/user';
import { Logo } from '../header/header';
import { KeyValuePipe } from '@angular/common';

@Component({
  selector: 'home-header',
  imports: [FormsModule, FontAwesomeModule, RouterModule, KeyValuePipe, Logo],
  templateUrl: './home-header.html'
})
export class HomeHeader {

  protected readonly categories: Map<HomeCategories, string> = new Map([
    [HomeCategories.AboutUs, "Home"],    
    [HomeCategories.Partners, "Partners List"],
    [HomeCategories.DailyBread, "Daily Bread"]
  ]);

  protected appDrawer = SideDrawer.name;
  protected checkoutDrawer = CheckoutDrawer.name;
  protected userRole = UserRole;

  protected user: IUser = UserService.DefaultUser;

  constructor(
    private router: Router,
    protected userService: UserService,
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