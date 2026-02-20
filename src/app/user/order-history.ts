import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IPayMethod, IUser, UserService } from './user';
import { Cart, CartService } from '../checkout/cart';
import { DecimalPipe } from '@angular/common';
import { DeliveryService, DeliveryType } from '../header/addressBook';
import { OrderItems } from "./view-receipt";
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
  payment: IPayMethod,
  deliveryType?: DeliveryType,
  deliveryInstructions?: string,
  inProgress?: boolean,
  statusTime?: number
};

@Component({
  selector: 'order-history',
  imports: [FormsModule, FontAwesomeModule, RouterModule, DecimalPipe, OrderItems],
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
    private deliveryService: DeliveryService,
    private cdr: ChangeDetectorRef) { }

  protected numItems = CartService.numItems;

  protected checkoutPrice(order: IOrderHistory): number {
    const subTotal = CartService.subTotal(order.cart);
    const deliveryFee = order.deliveryType != undefined ? this.deliveryService.getDeliveryFee() : 0;
    const GST = subTotal * (order.gstPercentage / 100);
    const PST = subTotal * (order.pstPercentage / 100);

    return subTotal
      + deliveryFee
      + GST + PST
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