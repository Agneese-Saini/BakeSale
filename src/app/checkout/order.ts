import { DecimalPipe } from "@angular/common";
import { Component, ChangeDetectorRef, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IDeliverySettings, AddressBook, DeliveryService, DeliveryMode } from "../header/delivery";
import { Cart, CartService } from "./cart";
import { DriverTip, TipAmountDialog } from "./checkout";
import { IOrderHistory } from "../user/order-history";


@Component({
  selector: 'add-tip',
  imports: [FormsModule, FontAwesomeModule, DecimalPipe],
  template: `
<div class="flex flex-col">
    <div class="flex justify-between items-center text-md">
      <b>Add Tip:</b>
      <p class="font-mono text-right">{{ '$' }}{{ tipAmount | number: '1.2-2' }}</p>
    </div>

    <label class="text-sm text-base-content/70">
      100% of your tip goes to your courier. Tips percentage is based on your order subtotal
      ({{ '$' }}{{ subTotal | number: '1.2-2' }}) before any discounts or promotions.
    </label>

    <div class="flex flex-wrap items-center gap-2 mt-2">
      @for (tip of tips; track tip) {
      <button [class]="'btn rounded-box ' + (tip == selectedTip ? 'btn-neutral' : '')" (click)="onSelectTip(tip)">
        @if (tip == 0) {
        Other
        } @else {
        {{ tip }}%
        }
      </button>
      }
    </div>
</div>
`
})
export class Tip {

  protected readonly tips = Object.values(DriverTip).filter((value) => typeof value === 'number') as number[];

  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;
  protected shoppingCart: Cart = new Map();
  protected selectedTip: DriverTip = DriverTip.Tip_15;

  protected get subTotal(): number {
    return CartService.subTotal(this.shoppingCart);
  }

  protected get tipAmount(): number {
    return Tip.getAmount(this.shoppingCart, this.selectedTip, this.deliverySettings.tipAmount);
  }

  constructor(
    private deliveryService: DeliveryService,
    private cartService: CartService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;

      if (data.tip != undefined) {
        this.selectedTip = data.tip;
      } else {
        this.deliverySettings.tip = this.selectedTip;
        this.deliveryService.setDeliverySetting(this.deliverySettings);
      }

      this.cdr.detectChanges();
    });

    this.cartService.shoppingCart$.subscribe(data => {
      this.shoppingCart = data;
      this.cdr.detectChanges();
    });
  }

  protected onSelectTip(tip: DriverTip) {
    if (tip == DriverTip.Tip_Custom) {
      this.openTipAmountDialog();
    }
    else {
      this.deliverySettings.tip = tip;
      this.deliveryService.setDeliverySetting(this.deliverySettings);
    }
  }

  protected openTipAmountDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";

    const dialogRef = this.dialog.open(TipAmountDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  static getAmount(cart: Cart, tip?: DriverTip, amount?: number): number {
    if (tip == DriverTip.Tip_Custom) {
      return amount ? amount : 0;
    }

    if (tip) {
      const percentage = Number(tip);
      return CartService.subTotal(cart) * percentage / 100;
    }

    return 0.0;
  }
}


@Component({
  selector: 'order-total',
  imports: [FormsModule, FontAwesomeModule, DecimalPipe, Tip],
  template: `
<div class="flex flex-col gap-1">
  <div class="flex justify-between text-md">
    <h1>SubTotal:</h1>
    <div class="flex flex-col items-end">
      <div class="flex gap-2">
        @if (originalPrice != subTotal) {
        <p class="font-mono text-sm label line-through">{{ '$' }}{{ originalPrice | number: '1.2-2' }}</p>
        }
        <p class="font-mono">{{ '$' }}{{ subTotal | number: '1.2-2' }}</p>
      </div>
    </div>
  </div>

  @if (couponDiscount > 0) {
  <div class="flex justify-between items-center text-success">
    <h1>Coupon discount:</h1>
    <p class="font-mono text-right">-{{ '$' }}{{ couponDiscount | number: '1.2-2' }}</p>
  </div>
  }

  @if (isDelivery) {
  <div class="flex justify-between items-center text-md">
    <h1>
      Delivery Fee: <fa-icon icon="circle-info" class="tooltip tooltip-bottom"
        data-tip="Delivery fee varies for each merchant based on your location and availability of nearby couriers."></fa-icon>
    </h1>
    <p class="font-mono text-right">{{ '$' }}{{ deliveryFee | number: '1.2-2' }}</p>
  </div>
  }

  <div class="flex justify-between text-md">
    <span class="flex flex-col">
      <h1>Taxes:</h1>
      <h2 class="label text-xs px-2">
        {{ GST_Rate }}% GST: {{ '$' }}{{ GST | number: '1.2-2' }}<br />
        {{ PST_Rate }}% PST: {{ '$' }}{{ PST | number: '1.2-2' }}
      </h2>
    </span>
    <p class="font-mono text-right">{{ '$' }}{{ (GST + PST) | number: '1.2-2' }}</p>
  </div>

  <div class="divider"></div>

  @if (isDelivery) {
  @if (!order) {
  <add-tip></add-tip>
  } @else {
  <div class="flex justify-between items-center text-md">
    <h1>Tip:</h1>
    <p class="font-mono text-right">{{ '$' }}{{ tipAmount | number: '1.2-2' }}</p>
  </div>
  <p class="label text-sm">100% of your tip went to the courier.</p>
  }
  <div class="divider"></div>
  }

  <div class="flex justify-between items-center text-xl">
    <b>Total:</b>
    <b class="font-mono text-right">{{ '$' }}{{ checkoutPrice | number: '1.2-2' }}</b>
  </div>
</div>
`
})
export class OrderTotal {

  static readonly GST_Rate: number = 7; // Percentage %
  static readonly PST_Rate: number = 4; // Percentage %

  protected GST_Rate = OrderTotal.GST_Rate;
  protected PST_Rate = OrderTotal.PST_Rate;

  @Input()
  public order?: IOrderHistory;

  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;
  protected shoppingCart: Cart = new Map();
  protected couponDiscount: number = 0.0;

  protected get isDelivery(): boolean {
    return this.order ? (this.order.deliveryType != undefined) : (this.deliverySettings.mode == DeliveryMode.Delivery);
  }

  protected get deliveryFee(): number {
    return this.isDelivery ? CartService.deliveryFee() : 0;
  }

  protected get numItems() {
    return CartService.numItems(this.order ? this.order.cart : this.shoppingCart);
  }

  protected get originalPrice(): number {
    return CartService.originalSubTotal(this.order ? this.order.cart : this.shoppingCart);
  }

  protected get subTotal(): number {
    return CartService.subTotal(this.order ? this.order.cart : this.shoppingCart);
  }

  protected get GST(): number {
    return this.subTotal * (OrderTotal.GST_Rate / 100);
  }

  protected get PST(): number {
    return this.subTotal * (OrderTotal.PST_Rate / 100);
  }

  protected get tipAmount(): number {
    return this.order ? this.order.tipAmount : Tip.getAmount(this.shoppingCart, this.deliverySettings.tip, this.deliverySettings.tipAmount);
  }

  protected get checkoutPrice(): number {
    return this.subTotal + this.deliveryFee + this.GST + this.PST - this.couponDiscount + this.tipAmount;
  }

  constructor(
    private deliveryService: DeliveryService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;
      this.cdr.detectChanges();
    });

    this.cartService.shoppingCart$.subscribe(data => {
      this.shoppingCart = data;
      this.cdr.detectChanges();
    });

    this.cartService.coupon$.subscribe(data => {
      this.couponDiscount = data;
      this.cdr.detectChanges();
    });
  }
}