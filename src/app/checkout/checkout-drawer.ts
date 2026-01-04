import { KeyValuePipe, DecimalPipe } from "@angular/common";
import { Component, ChangeDetectorRef } from "@angular/core";
import { RouterLink } from "@angular/router";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { Cart, CartService, EmptyCartLinks } from "./cart";
import { CartItemList } from "./cartItemDialog";
import { CheckoutCoupon } from "./checkout";

@Component({
  selector: 'app-checkout-drawer',
  imports: [KeyValuePipe, DecimalPipe, CartItemList, FaIconComponent, CheckoutCoupon, RouterLink, EmptyCartLinks],
  templateUrl: './checkout-drawer.html'
})
export class CheckoutDrawer {

  static readonly name = "checkout-drawer";

  protected shoppingCart: Cart = new Map();
  protected couponDiscount: number = 0.0;

  protected get numItems() {
    return CartService.numItems(this.shoppingCart);
  }

  protected get totalItems() {
    return CartService.totalItems(this.shoppingCart);
  }

  protected get originalSubTotal(): number {
    return CartService.originalSubTotal(this.shoppingCart);
  }

  protected get subTotal(): number {
    return CartService.subTotal(this.shoppingCart);
  }

  constructor(
    private cartService: CartService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.cartService.shoppingCart$.subscribe(data => {
      this.shoppingCart = data;
      this.cdr.detectChanges();
    });

    this.cartService.coupon$.subscribe(data => {
      this.couponDiscount = data;
      this.cdr.detectChanges();
    });
  }

};