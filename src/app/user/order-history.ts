import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IUser, UserService } from './user';
import { Cart, CartService } from '../checkout/cart';
import { DecimalPipe } from '@angular/common';
import { Item } from '../content/item';
import { DeliveryType } from '../header/delivery';
import { OrderSummary } from "./view-receipt";
import { IAddress } from '../header/addressDialog';
import { ITime } from '../header/timeslots';

export interface IOrderHistory {
  tipAmount: number,
  gstPercentage: number,
  pstPercentage: number,
  couponDiscount: number,
  cart: Cart,
  date: number,
  time: ITime,
  address: IAddress,
  payment: string,
  deliveryType?: DeliveryType,
  deliveryInstructions?: string,
  inProgress?: boolean
};

@Component({
  selector: 'order-history',
  imports: [FormsModule, FontAwesomeModule, RouterModule, DecimalPipe, OrderSummary],
  templateUrl: "order-history.html"
})
export class OrderHistory {

  protected user: IUser = UserService.DefaultUser;

  protected filters: string[] = [
    "Today", "Tomorrow", "3 days old"
  ];

  protected currentFilter?: string;

  constructor(
    private service: UserService,
    private cdr: ChangeDetectorRef) { }

  protected numItems = CartService.numItems;
  protected originalSubTotal = CartService.originalSubTotal;

  protected numChoices = Item.numChoices;
  protected getPrice = Item.getPrice;
  protected getAmount = Item.getAmount;

  protected subTotal(order: IOrderHistory): number {
    return CartService.subTotal(order.cart);
  }

  protected GST(order: IOrderHistory): number {
    return this.subTotal(order) * (order.gstPercentage / 100);
  }

  protected PST(order: IOrderHistory): number {
    return this.subTotal(order) * (order.pstPercentage / 100);
  }

  protected deliveryFee(order: IOrderHistory): number {
    return order.deliveryType != undefined ? CartService.deliveryFee() : 0;
  }

  protected checkoutPrice(order: IOrderHistory): number {
    return this.subTotal(order)
      + this.deliveryFee(order)
      + (this.GST(order) + this.PST(order))
      - order.couponDiscount
      + order.tipAmount;
  }

  protected ngOnInit() {
    this.service.user$.subscribe(data => {
      this.user = data;
      this.cdr.detectChanges();
    });
  }

  protected onSelectFilter(filter?: string) {
    this.currentFilter = filter;
  }
};