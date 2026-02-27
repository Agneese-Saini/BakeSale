import { ChangeDetectorRef, Component } from '@angular/core';
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
import { CategoryItemsList, ItemsList } from "../content/itemList";

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
  imports: [FormsModule, FontAwesomeModule, RouterModule, DecimalPipe, DatePipe, OrderItems, ItemsList],
  templateUrl: "order-history.html"
})
export class OrderHistory {

  protected readonly ItemsPerPage = CategoryItemsList.ItemsPerPage;

  protected user: IUser = UserService.DefaultUser;

  protected filters: string[] = [
    "Today", "Yesterday", "2 Weeks", "1 Month", "3 Months", "1 Year", "2 Years", "3 Years"
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
				image: [ "https://cdn.prod.website-files.com/614a379840dbad1848e598c2/679906d29abceb2bbceb0696_679905de4268ad4dc4eae460_IMG_1630.jpeg" ],
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
				image: [ "https://cdn.prod.website-files.com/614a379840dbad1848e598c2/679906d29abceb2bbceb0696_679905de4268ad4dc4eae460_IMG_1630.jpeg" ],
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