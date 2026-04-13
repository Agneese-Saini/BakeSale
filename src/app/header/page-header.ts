import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Router, RouterModule } from '@angular/router';
import { SideDrawer } from '../sidedrawer/sidedrawer';
import { CheckoutDrawer } from '../checkout/checkout-drawer';
import { IUser, User, UserRole, UserService } from '../user/user';
import { Logo, NotificationBottomSheet } from './header';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Cart, CartService } from '../checkout/cart';

@Component({
  selector: 'page-header',
  imports: [FormsModule, FontAwesomeModule, RouterModule, Logo],
  templateUrl: './page-header.html'
})
export class PageHeader {

  protected appDrawer = SideDrawer.name;
  protected checkoutDrawer = CheckoutDrawer.name;
  protected userRole = UserRole;

  protected user: IUser = UserService.DefaultUser;
  protected shoppingCart: Cart = new Map();

  protected get numActiveOrders(): number {
    return User.numActiveOrders(this.user);
  }

  protected get numItems() {
    return CartService.numItems(this.shoppingCart);
  }

  constructor(
    private router: Router,
    private bottomSheet: MatBottomSheet,
    private userService: UserService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.userService.user$.subscribe(data => {
      this.user = data;
      this.cdr.detectChanges();
    });

    this.cartService.shoppingCart$.subscribe(data => {
      this.shoppingCart = data;
      this.cdr.detectChanges();
    });
  }

  protected openBottomSheet() {
    this.bottomSheet.open(NotificationBottomSheet);
  }

  protected onClickHome() {
    this.router.navigate(['/']);
  }
};