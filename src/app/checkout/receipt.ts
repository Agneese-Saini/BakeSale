import { DecimalPipe } from "@angular/common";
import { ChangeDetectorRef, Component, forwardRef, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Cart, CartService } from "./cart";
import { IItem, Item } from "../content/item";
import { IDeliverySettings, AddressBook, DeliveryService, DeliveryMode } from "../header/addressBook";
import { IOrderHistory } from "../user/order-history";
import { ISubscription, Subscribe } from "../custom/subscribe";
import { SubscribeItemList } from "../custom/subscribeItemList";
import { AddTip } from "./tip";

@Component({
  selector: 'receipt',
  imports: [FormsModule, FontAwesomeModule, DecimalPipe, forwardRef(() => AddTip)],
  templateUrl: 'receipt.html'
})
export class Receipt {

  static readonly GST_Rate: number = 7; // Percentage %
  static readonly PST_Rate: number = 4; // Percentage %

  protected GST_Rate = Receipt.GST_Rate;
  protected PST_Rate = Receipt.PST_Rate;

  @Input()
  public order?: IOrderHistory;

  @Input()
  public subscription?: ISubscription;

  protected shoppingCart: Cart = new Map();
  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;

  constructor(
    private cartService: CartService,
    private deliveryService: DeliveryService) { }

  protected ngOnInit() {
    this.cartService.shoppingCart$.subscribe(data => {
      this.shoppingCart = data;
    });

    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;
    });
  }

  protected get isDelivery(): boolean {
    if (this.order) {
      return this.order.deliveryType != undefined;
    }

    if (this.subscription != undefined) {
      return true;
    }
    
    return this.deliverySettings.mode == DeliveryMode.Delivery;
  }

  protected get selectedItems(): IItem[] {
    if (this.subscription) {
      return SubscribeItemList.getSelectedItems(this.subscription.category);
    }

    if (this.order) {
      let items: IItem[] = [];
      for (const [key, value] of this.order.cart) {
        for (const item of value) {
          items.push(item);
        }
      }
      return items;
    }

    let items: IItem[] = [];
    for (const [key, value] of this.shoppingCart) {
      for (const item of value) {
        items.push(item);
      }
    }
    return items;
  }

  protected getAmount = Item.getAmount;
  protected getPrice = Item.getPrice;

  protected getSubTotal(): number {
    return Subscribe.getSubTotal(this.selectedItems);
  }

  protected getSavings(): number {
    return Subscribe.getSavings(this.selectedItems);
  }

  protected getCouponDiscount(): number {
    if (this.order) {
      return this.order.couponDiscount;
    }

    return this.cartService.getCouponDiscount();
  }

  protected getGST(): number {
    return this.getSubTotal() * (Receipt.GST_Rate / 100);
  }

  protected getPST(): number {
    return this.getSubTotal() * (Receipt.PST_Rate / 100);
  }

  protected getServiceFee(): number {
    return Subscribe.getServiceFee(this.selectedItems);
  }

  protected getDeliveryFee(): number {
    if (this.subscription) {
      return 0;
    }

    return this.isDelivery
      ? this.deliveryService.getDeliveryFee()
      : 0;
  }

  protected getTipAmounmt(): number {
    if (this.subscription) {
      return 0;
    }
    
    if (this.order) {
      return this.order.tipAmount;
    }

    return this.isDelivery
      ? AddTip.getAmount(this.getSubTotal(), this.deliverySettings.tip, this.deliverySettings.tipAmount)
      : 0;
  }

  protected getTotal(): number {
    return this.getSubTotal() + this.getServiceFee() + this.getDeliveryFee() + (this.getGST() + this.getPST()) + this.getTipAmounmt() - this.getCouponDiscount();
  }

  protected getCustomText(): string {
    if (this.order && this.order.payment.cardNumber) {
      const type = this.order.payment.type;
      const lastFour = this.order.payment.cardNumber.slice(-4);
      return type + " **** " + lastFour;
    }

    if (this.subscription) {
      return "/per delivery";
    }

    return "";
  }
}