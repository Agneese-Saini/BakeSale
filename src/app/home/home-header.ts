import { ChangeDetectorRef, Component, Injectable } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Router, RouterModule } from '@angular/router';
import { SideDrawer } from '../sidedrawer/sidedrawer';
import { CheckoutDrawer } from '../checkout/checkout-drawer';
import { IUser, UserRole, UserService } from '../user/user';
import { Logo } from '../header/header';
import { KeyValuePipe } from '@angular/common';
import { HomeCategories, HomeService } from './home';

@Component({
  selector: 'home-header',
  imports: [FormsModule, FontAwesomeModule, RouterModule, KeyValuePipe, Logo],
  templateUrl: './home-header.html'
})
export class HomeHeader {

  protected readonly homeCategories = HomeCategories;

  protected readonly categories: Map<HomeCategories, string> = new Map([
    [HomeCategories.AboutUs, "Home"],
    [HomeCategories.Shop, "Shop"],
    [HomeCategories.DailyBread, "Daily Bread"],
    [HomeCategories.Partners, "Partners List"]
  ]);

  protected appDrawer = SideDrawer.name;
  protected checkoutDrawer = CheckoutDrawer.name;
  protected userRole = UserRole;

  protected user: IUser = UserService.DefaultUser;

  constructor(
    private router: Router,
    private homeService: HomeService,
    private userService: UserService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {    
    this.setHomeCategory(HomeCategories.AboutUs);

    this.userService.user$.subscribe(data => {
      this.user = data;
      this.cdr.detectChanges();
    });
  }

  protected getHomeCategory(): HomeCategories {
    return this.homeService.getCategory();
  }

  protected setHomeCategory(category: HomeCategories) {
    this.homeService.setCategory(category);

    if (category == HomeCategories.Shop) {
      this.router.navigate(['/shop']);
    }
  }

  protected onClickHome() {
    this.router.navigate(['/']);
  }
};