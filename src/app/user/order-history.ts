import { ChangeDetectorRef, Component, EventEmitter, Injectable, Input, Output, Pipe, PipeTransform } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IPayMethod, IUser, UserService } from './user';
import { Cart, CartService } from '../checkout/cart';
import { DatePipe, DecimalPipe } from '@angular/common';
import { DeliveryService, DeliveryType } from '../header/addressBook';
import { OrderItems } from "./view-receipt";
import { IAddress } from '../header/addressDialog';
import { ITime } from '../header/timeslots';
import { IItem } from '../content/item';
import { CategoryItemsList } from "../content/itemList";
import { PageHeader } from "../header/page-header";

export interface IOrderHistory {
  id?: string,
  tipAmount: number,
  gstPercentage: number,
  pstPercentage: number,
  couponDiscount: number,
  cart: Cart,
  date: number,
  time: ITime,
  estimatedTime?: number,
  completionTime?: number,
  isDelayed?: boolean,
  address: IAddress,
  payment: IPayMethod,
  deliveryType?: DeliveryType,
  deliveryInstructions?: string,
  statusTime?: number,
  user?: string,
  driver?: string,
};


@Component({
  selector: 'countdown',
  standalone: true,
  template: `{{ formattedTime }}`
})
export class CountdownTimer {

  @Input()
  public targetDate: number = Date.now();

  @Output()
  public onDelay = new EventEmitter<void>();

  protected formattedTime: string = '...';

  private intervalId: any;

  constructor(
    protected cdr: ChangeDetectorRef) { }

  protected ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.updateCountdown();
    }, 1000);

    this.updateCountdown(); // Initial call to display immediately
  }

  protected updateCountdown(): void {
    const now = new Date().getTime();
    const distance = this.targetDate - now;

    if (distance < 0) {
      this.formattedTime = "Driver running late";
      this.onDelay.emit();

      this.cdr.detectChanges();
      return;
    }

    const time = CountdownTimer.formatTime(distance);

    if (time.days > 0) {
      this.formattedTime = `${time.days} days (prep)`;
    } else if (time.hours > 0) {
      this.formattedTime = `${time.hours}h ${time.minutes}m`;
    } else if (time.minutes > 0) {
      this.formattedTime = `${time.minutes} mins`;
    } else {
      this.formattedTime = `${time.seconds} secs`;
    }

    this.cdr.detectChanges();
  }

  protected ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId); // Crucial for cleanup
    }
  }

  static formatTime(ms: number) {
    return {
      days: Math.floor(ms / (1000 * 60 * 60 * 24)), 
      hours: Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), 
      minutes: Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)), 
      seconds: Math.floor((ms % (1000 * 60)) / 1000)
    }
  }
}


@Component({
  selector: 'order-history',
  imports: [FormsModule, FontAwesomeModule, RouterModule, DecimalPipe, DatePipe, OrderItems, CountdownTimer, PageHeader],
  templateUrl: "order-history.html"
})
export class OrderHistory {

  protected readonly ItemsPerPage = CategoryItemsList.ItemsPerPage;

  protected user: IUser = UserService.DefaultUser;

  protected filters: string[] = [
    "1 Week", "2 Weeks", "1 Month", "3 Months", "1 Year", "2 Years", "3 Years"
  ];

  protected currentFilter?: string;

  protected get buyAgain(): IItem[] {
    let items: IItem[] = [
      {
        name: 'Red Velvet',
        about: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac eros sit amet lorem facilisis vulputate at non dui. \
						Aenean tempus ligula nec suscipit venenatis. Fusce luctus ipsum diam, aliquet dictum ligula imperdiet et. \
						In lectus velit, semper ut iaculis vel, congue nec ipsum. Cras ultrices eros elit, gravida euismod mi lobortis \
						vitae. Aenean volutpat vehicula orci, ut consequat enim auctor sed. Vestibulum mi erat, accumsan eget ligula vel,\
						 posuere pellentesque justo. Aenean dui orci, imperdiet vel sapien i",
        ingredients: "Flour, sugar, eggs, fat (butter/oil), liquid (milk), leavening (baking powder/soda), salt, and flavor (vanilla extract)",
        image: ["https://cdn.prod.website-files.com/614a379840dbad1848e598c2/679906d29abceb2bbceb0696_679905de4268ad4dc4eae460_IMG_1630.jpeg"],
        amount: 0,
        details: [
          { header: 'Gluten Free', detail: 'Yes' },
          { header: 'Dairy Free', detail: 'No' },
          { header: 'Flavors', detail: 'Vanila, Candy, Butterscotch' }
        ],
        price: { value: 19.99 }
      },
      {
        name: 'Red Velvet',
        about: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac eros sit amet lorem facilisis vulputate at non dui. \
						Aenean tempus ligula nec suscipit venenatis. Fusce luctus ipsum diam, aliquet dictum ligula imperdiet et. \
						In lectus velit, semper ut iaculis vel, congue nec ipsum. Cras ultrices eros elit, gravida euismod mi lobortis \
						vitae. Aenean volutpat vehicula orci, ut consequat enim auctor sed. Vestibulum mi erat, accumsan eget ligula vel,\
						 posuere pellentesque justo. Aenean dui orci, imperdiet vel sapien i",
        ingredients: "Flour, sugar, eggs, fat (butter/oil), liquid (milk), leavening (baking powder/soda), salt, and flavor (vanilla extract)",
        image: ["https://cdn.prod.website-files.com/614a379840dbad1848e598c2/679906d29abceb2bbceb0696_679905de4268ad4dc4eae460_IMG_1630.jpeg"],
        amount: 0,
        details: [
          { header: 'Gluten Free', detail: 'Yes' },
          { header: 'Dairy Free', detail: 'No' },
          { header: 'Flavors', detail: 'Vanila, Candy, Butterscotch' }
        ],
        price: { value: 19.99 }
      }
    ];
    return items;
  }

  protected readonly CurrentTime = Date.now();

  protected numItems = CartService.numItems;
  protected formatTime = CountdownTimer.formatTime;

  constructor(
    private service: UserService,
    private deliveryService: DeliveryService,
    private cdr: ChangeDetectorRef) { }

  protected estimatedTime(order: IOrderHistory): number {
    const Now = Date.now();

    if (order.estimatedTime == undefined || order.estimatedTime < Now) return 0;

    return order.estimatedTime - Now;
  }

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

  protected onDeliveryDelayed(order: IOrderHistory) {
    if (order.deliveryType != undefined) {
      // Add an extra 5 min delay
      order.estimatedTime = Date.now() + 5 * 60000;
      order.isDelayed = true;
    }
  }
};

