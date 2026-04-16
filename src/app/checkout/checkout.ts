import { ChangeDetectorRef, Component, Injectable } from '@angular/core';
import { AddressBook, AddressBookDialog, DeliveryService, DeliveryType, IDeliverySettings } from '../header/addressBook';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DeliveryMode } from '../header/addressBook';
import { CartService, Cart } from './cart';
import { KeyValuePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { TimeslotsDialog } from '../header/timeslots';
import { Router, RouterModule } from '@angular/router';
import { IOrderHistory } from '../user/order-history';
import { IPayMethod, UserService } from '../user/user';
import { ItemChoiceList } from '../content/itemChoice';
import { CartItemList } from './cartItemList';
import { Receipt } from './receipt';
import { AddressDialog, BuildingType, IAddress } from '../header/addressDialog';
import { AddTip } from './tip';
import { SignInDialog } from '../user/signUpDialog';
import { BehaviorSubject } from 'rxjs';

export enum DriverTip {
  Tip_10 = 10,
  Tip_15 = 15,
  Tip_20 = 20,
  Tip_30 = 30,
  Tip_Custom = 0
};


@Injectable({
  providedIn: 'root' // Makes the service a singleton and available throughout the app
})
export class OrderService {

  private _orders = new BehaviorSubject<IOrderHistory[]>([]);
  public orders$ = this._orders.asObservable(); // Expose as Observable

  public addOrder(order: IOrderHistory, user: UserService): string {
    let orders = this._orders.value;

    // Generate unique order ID
    const uniqueId = order.date + '' + user.id;
    const orderId = this.generateHash(uniqueId, 7);
    order.id = orderId;

    // Add order to user's order history
    user.addOrder(order);

    // Add order to global order history (so admins can track without logging in user accounts)
    let globalOrder = structuredClone(order);
    globalOrder.user = user.id;
    orders.push(globalOrder);
    this._orders.next(orders);

    return orderId;
  }

  private generateHash(str: string, length: number): string {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    const fullHash = (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
    return fullHash.substring(0, length);
  }
}


@Component({
  selector: 'input-coupon',
  imports: [FormsModule, FontAwesomeModule],
  template: `
<h1 class="text-xl font-medium">Add Coupon</h1>

<div class="flex justify-between gap-2 py-2">
  @if (couponError) {
  <div class="tooltip tooltip-open w-full" [attr.data-tip]="couponError">
    <input type="search" class="input input-sm input-bordered placeholder-gray-500 shadow shadow-error"
      placeholder="Enter Coupon Code" [(ngModel)]="couponCode" (change)="couponError=undefined;" />
  </div>
  } @else {
  <input type="search" class="input input-sm input-bordered placeholder-gray-500 w-full" placeholder="Enter Coupon Code"
    [(ngModel)]="couponCode" />
  }
  <button class="btn btn-neutral btn-sm text-xs font-light p-2" (click)="addCoupon()">
    ADD COUPON
  </button>
</div>

<div class="flex gap-2 text-xs opacity-60">
  <fa-icon icon="info-circle"></fa-icon>
  <i>Coupons can be found in door to door flyers, in store and online promotions.</i>
</div>
`
})
export class CheckoutCoupon {

  protected couponCode?: string;
  protected couponError?: string;
  protected couponTimer: any;

  constructor(
    private cartService: CartService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef) { }

  protected ngOnDestroy() {
    clearInterval(this.couponTimer);
  }

  protected addCoupon() {
    // clear timer
    this.couponError = undefined;
    clearInterval(this.couponTimer);

    // try add coupon
    const ret = this.cartService.addCoupon(this.couponCode);
    if (ret != null) { // there was an error
      this.couponError = ret;

      this.couponTimer = setInterval(() => {
        this.couponError = undefined;
        this.cdr.detectChanges();
      }, 3000);
      return;
    }

    // success
    this.snackBar.open("Coupon added successfully!", "Close", {
      duration: 2500
    });
  }
}


@Component({
  selector: 'checkout-details',
  imports: [FormsModule, FontAwesomeModule],
  template: `
<div class="flex flex-col gap-4">
  <div class="bg-base-200 rounded-box shadow-lg p-6">
    @if (deliveryMode) {
    <h1 class="text-2xl font-semibold">{{ deliveryMode.label }} Details</h1>
    <table class="table">
      <tbody>
        <tr>
          <div class="flex justify-between items-center p-2">
            <div class="flex gap-4 text-lg p-2 items-center">
              <fa-icon [class]="deliverySettings.address ? '' : 'text-error'" icon="location-dot"></fa-icon>
              @if (isDelivery) {
              @if (deliverySettings.address) {
              <a class="link flex flex-col" style="text-decoration: none;" (click)="openAddressBookDialog()">
                {{ printAddress(deliverySettings.address) }}
              </a>
              } @else {
              <a class="link text-error" style="text-decoration: none;" (click)="openAddressBookDialog()">
                Enter Address
              </a>
              }
              } @else {
              @if (deliverySettings.address) {
              <label class="flex flex-col">
                {{ printAddress(deliverySettings.address) }}
              </label>
              } @else {
              <span class="loading loading-dots loading-xl text-error"></span>
              }
              }
            </div>
            @if (isDelivery) {
            <button [class]="'btn btn-sm shadow ' + (!deliverySettings.address ? 'btn-outline btn-error' : '')" (click)="openAddressBookDialog()">Edit</button>
            } @else {
            <button [class]="'btn btn-sm shadow ' + (!deliverySettings.address ? 'btn-outline btn-error' : '')">Map</button>
            }
          </div>
        </tr>

        <tr>
          <div class="flex justify-between items-center p-2">
            <div class="flex gap-4 text-lg p-2 items-center">
              <fa-icon [class]="deliverySettings.timeslot ? '' : 'text-error'" icon="clock"></fa-icon>
              <a class="link flex flex-col text-lg" style="text-decoration: none;" (click)="openTimeslotsDialog()">
                @if (deliverySettings.timeslot) {                
                <p class="text-xs">
                  Scheduled Time:
                </p>
                <b>{{ deliverySettings.timeslot.label }}</b>
                @if (deliverySettings.time) {
                <p class="text-sm">
                  {{ printTimeslot(deliverySettings.time) }}
                </p>
                }
                } @else {
                <p class="text-error">
                  Select Timeslot
                </p>
                }
              </a>
            </div>
            <button [class]="'btn btn-sm shadow ' + (!deliverySettings.timeslot ? 'btn-outline btn-error' : '')" (click)="openTimeslotsDialog()">Edit</button>
          </div>
        </tr>

        @if (isDelivery) {
        <tr>
          <div class="flex justify-between items-center p-2">
            <div class="flex gap-4 text-lg p-2 items-center">
              <fa-icon icon="user" class="tooltip tooltip-left" data-tip="Delivery instructions"></fa-icon>
              <a class="link flex flex-col" style="text-decoration: none;" (click)="openDeliveryInstructionsDialog()">
                <b>{{ deliveryType }}</b>
                @if (deliveryInstructions == null || deliveryInstructions.length < 2) { 
                  <p class="text-success text-sm">Add delivery instruction</p>
                  } @else {
                  <i class="text-lg font-thin px-2">'{{ deliveryInstructions }}'</i>
                  }
              </a>
            </div>
            <button class="btn btn-sm shadow" (click)="openDeliveryInstructionsDialog()">Edit</button>
          </div>
        </tr>
        }
      </tbody>
    </table>
    }
  </div>

  <div class="bg-base-200 rounded-box shadow-lg p-6">
    <h1 class="text-2xl font-semibold">Payment</h1>
    <div class="flex justify-between items-center p-2">
      <div class="flex gap-4 text-lg p-2 items-center">
        @if (deliverySettings.payment && deliverySettings.payment.icon) {
        <fa-icon [icon]="['fab', deliverySettings.payment.icon]"></fa-icon>         
        } @else {
        <fa-icon [class]="!deliverySettings.payment ? 'text-error' : ''" icon="credit-card"></fa-icon> 
        }
        <a [class]="'link flex flex-col ' + (deliverySettings.payment ? '' : 'text-error')" style="text-decoration: none;" (click)="openPaymentMethodDialog()">
          <p [class]="deliverySettings.payment ? 'font-bold' : ''">{{ deliverySettings.payment ? deliverySettings.payment.name : 'Select Payment method' }}</p>
          @if (deliverySettings.payment && deliverySettings.payment.cardNumber) {
          <p class="text-sm">{{ deliverySettings.payment.type }} **** **** **** {{ getLastFourDigits(deliverySettings.payment.cardNumber) }}</p>
          }
        </a>
      </div>
      <button [class]="'btn btn-sm shadow ' + (!deliverySettings.payment ? 'btn-outline btn-error' : '')" (click)="openPaymentMethodDialog()">Edit</button>
    </div>
  </div>
</div>
`
})
export class CheckoutDetails {

  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;
  protected addressBook: IAddress[] = [];

  protected printAddress = AddressBook.printAddress;
  protected printTimeslot = AddressBook.printTimeslot;

  protected get isDelivery(): boolean {
    return (this.deliverySettings.mode == DeliveryMode.Delivery);
  }

  public get deliveryMode() {
    return AddressBook.DeliveryModes.get(this.deliverySettings.mode);
  }

  public get deliveryType() {
    if (this.deliverySettings.deliveryType) {
      return this.deliverySettings.deliveryType;
    }
    return DeliveryType.LeaveAtDoor;
  }

  public get deliveryInstructions() {
    return this.deliverySettings.deliveryInstructions;
  }

  constructor(
    private deliveryService: DeliveryService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;
      this.cdr.detectChanges();
    });

    this.deliveryService.addressBook$.subscribe(data => {
      this.addressBook = data;
      this.cdr.detectChanges();
    });
  }

  protected getLastFourDigits(cardNumber: string): string {
    return cardNumber.slice(-4);
  }

  protected openTimeslotsDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.width = '90%';

    const dialogRef = this.dialog.open(TimeslotsDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected openAddressBookDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = undefined;
    dialogConfig.width = '90%';

    const dialogRef = this.addressBook.length > 0
      ? this.dialog.open(AddressBookDialog, dialogConfig)
      : this.dialog.open(AddressDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected openDeliveryInstructionsDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.width = '90%';

    const dialogRef = this.dialog.open(DeliveryInstructionsDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected openPaymentMethodDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.width = '90%';

    const dialogRef = this.dialog.open(PaymentMethodDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }
}


@Component({
  selector: 'checkout-cart',
  imports: [FormsModule, FontAwesomeModule, KeyValuePipe, CartItemList],
  template: `
<div class="collapse collapse-arrow bg-base-200 shadow-lg p-2">
  <input type="checkbox" checked />
  <div class="collapse-title">
    <div class="flex gap-2 justify-between items-center text-xl">
      <div class="flex gap-2 text-xl">
        <fa-icon icon="shopping-cart"></fa-icon>
        <b class="font-semibold">Cart</b>
      </div>

      <p class="font-thin text-xl"><b>{{ totalItems }}</b> {{ (totalItems > 1) ? 'Items' : 'Item' }}</p>
    </div>
  </div>

  <div class="collapse-content flex flex-col gap-1">
    @for (cartItem of shoppingCart | keyvalue; track $index) {
    <cart-item-list [items]="cartItem.value" />
    }
  </div>
</div>
`
})
export class CheckoutCart {

  protected shoppingCart: Cart = new Map();

  protected get totalItems() {
    return CartService.totalItems(this.shoppingCart);
  }

  constructor(
    private cartService: CartService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.cartService.shoppingCart$.subscribe(data => {
      this.shoppingCart = data;
      this.cdr.detectChanges();
    });
  }
};


@Component({
  selector: 'app-checkout',
  imports: [FormsModule, FontAwesomeModule, RouterModule, CheckoutCoupon, CheckoutDetails, CheckoutCart, Receipt],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout {

  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;
  protected shoppingCart: Cart = new Map();
  protected couponDiscount: number = 0;

  protected isPlacingOrder: boolean = false;

  protected get numItems() {
    return CartService.numItems(this.shoppingCart);
  }

  protected get totalItems() {
    return CartService.totalItems(this.shoppingCart);
  }

  protected get isLoggedIn() {
    return this.userService.isLoggedIn();
  }

  constructor(
    private deliveryService: DeliveryService,
    private cartService: CartService,
    private orderService: OrderService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
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

  protected showDetailErrors(): boolean {
    let error: boolean = false;

    // Check address
    if (!this.deliverySettings.address) {
      error = true;
    }

    // Check time
    if (!this.deliverySettings.timeslot) {
      error = true;
    }

    // Check payment
    if (!this.deliverySettings.payment) {
      error = true;
    }

    return error;
  }

  protected showChoiceErrors(): boolean {
    let error: boolean = false;

    // Check shopping cart items for any errors
    for (let [key, value] of this.shoppingCart) {
      for (let item of value) {
        if (item.choices) {
          for (let [type, choices] of item.choices) {
            if (ItemChoiceList.ShowError(type, choices) == true) {
              error = true;
            }
          }
        }
      }
    }

    return error;
  }

  protected next() {
    const hasError = this.showDetailErrors();
    if (hasError) {
      this.snackBar.open("Please fix the errors before proceeding.", "Close", {
        duration: 2500
      });
      return;
    }

    this.isPlacingOrder = true;
  }

  protected placeOrder() {
    if (!this.isLoggedIn) {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.panelClass = "";
      dialogConfig.data = undefined;
      dialogConfig.height = "90%";
      const dialogRef = this.dialog.open(SignInDialog, dialogConfig);

      dialogRef.afterClosed().subscribe(() => {
        this.cdr.detectChanges();
      });

      return;
    }

    const hasError = this.showChoiceErrors();
    if (hasError || this.showDetailErrors()) {
      this.snackBar.open("Please fix the errors before proceeding.", "Close", {
        duration: 2500
      });
      return;
    }

    const CurrentTime = Date.now();
    const estimatedTime = CurrentTime
      + CartService.prepTime(this.shoppingCart)
      + ((this.deliverySettings.mode == DeliveryMode.Delivery ? 20 : 0) * 60000/*Convert mins into milliseconds*/);

    const order: IOrderHistory = {
      tipAmount: this.deliverySettings.mode == DeliveryMode.Delivery ? AddTip.getAmount(CartService.subTotal(this.shoppingCart), this.deliverySettings.tip, this.deliverySettings.tipAmount) : 0,
      deliveryType: this.deliverySettings.mode == DeliveryMode.Delivery ? this.deliverySettings.deliveryType : undefined,
      deliveryInstructions: this.deliverySettings.deliveryInstructions,
      gstPercentage: Receipt.GST_Rate,
      pstPercentage: Receipt.PST_Rate,
      couponDiscount: this.couponDiscount,
      cart: structuredClone(this.shoppingCart),
      date: CurrentTime,
      estimatedTime: estimatedTime,
      time: this.deliverySettings.time!,
      address: this.deliverySettings.address!,
      payment: this.deliverySettings.payment!
    };

    const orderId = this.orderService.addOrder(order, this.userService);
    console.log("orderId: " + orderId)
    this.shoppingCart.clear();
    this.router.navigate(['/order-placed', { id: orderId }]);

    this.snackBar.open("Order placed!", "Close", {
      duration: 2500
    });
  }
}

@Component({
  imports: [FormsModule, FontAwesomeModule, KeyValuePipe, MatDialogModule],
  template: `
<div class="bg-base-200">
  <div mat-dialog-content class="flex flex-col"> 
    <h2 class="text-4xl font-bold">Delivery Options</h2>
    <br />

    <h1>Address:</h1>
    <p class="font-mono px-2">
      @if (deliverySettings.address) {
      <b>{{ deliverySettings.address.addressLine }}</b>      
      @if (deliverySettings.address.buildingType) {
      <br/>
      <p class="flex gap-1">
        @switch (deliverySettings.address.buildingType) {
        @case (buildingType.Appartment) {
        <fa-icon icon="building"></fa-icon>
        }
        @case (buildingType.Hotel) {
        <fa-icon icon="hotel"></fa-icon>
        }
        @case (buildingType.House) {
        <fa-icon icon="house"></fa-icon>
        }
        @case (buildingType.Office) {
        <fa-icon icon="building"></fa-icon>
        }
        @default {
        <fa-icon icon="location-dot"></fa-icon>
        }
        }
        <b>{{ deliverySettings.address.buildingType }}</b>
      </p>
      }
      }
      @else {
      Unknown  
      }
    </p>
    
    <div class="bg-base-300 rounded-box mt-2 max-h-72 overflow-y-auto">
      <div class="flex">
        <table class="table table-zebra">
          <tbody>
            @for (type of deliveryType | keyvalue; track $index) {
            <tr class="h-12">
              <td>
                <label class="label cursor-pointer flex justify-between">
                  <span class="label-text text-xl">
                    {{ type.value }}
                  </span>
                  <input type="radio" name="delivery" class="radio" [checked]="this.selectedOption == type.value" [value]="type.value" [(ngModel)]="selectedOption" />
                </label>
              </td>
            </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
    <br />

    <fieldset class="fieldset">
      <legend class="fieldset-legend text-lg">Delivery Instructions:</legend>
      <input type="search" [class]="'input placeholder-gray-350 w-full ' + (instructions ? 'border border-neutral' : '')" 
        placeholder="e.g. Don't ring the door bell." [(ngModel)]="instructions" />
      <p class="flex justify-end label">Optional</p>
    </fieldset>
    <br />
  </div>

  <div mat-dialog-actions class="flex flex-col gap-2">
    <button class="btn btn-neutral w-full" (click)="onSave()">
      Save
    </button>
    <button class="btn bg-base-100 w-full" (click)="onClose()">
      Cancel
    </button>
  </div>
</div>
`
})
export class DeliveryInstructionsDialog {

  protected readonly deliveryType = DeliveryType;
  protected readonly buildingType = BuildingType;

  protected selectedOption: DeliveryType = DeliveryType.LeaveAtDoor;
  protected instructions?: string;

  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;

  constructor(
    private deliveryService: DeliveryService,
    private dialogRef: MatDialogRef<DeliveryInstructionsDialog>,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;

      if (data.address) {
        if (data.deliveryType != undefined) {
          this.selectedOption = data.deliveryType;
        } else {
          // Default
          this.selectedOption = DeliveryType.LeaveAtDoor;
        }

        if (data.deliveryInstructions != null) {
          this.instructions = data.deliveryInstructions;
        }
      }

      this.cdr.detectChanges();
    });
  }

  protected onSave() {
    this.deliverySettings.deliveryType = this.selectedOption;
    this.deliverySettings.deliveryInstructions = this.instructions;
    this.deliveryService.setDeliverySetting(this.deliverySettings);

    this.dialogRef.close();
  }

  protected onClose() {
    this.dialogRef.close();
  }
}


@Component({
  imports: [FormsModule, FontAwesomeModule, MatDialogModule],
  template: `
<div class="bg-base-200">
  <div mat-dialog-content class="flex flex-col"> 
    <h2 class="text-4xl font-bold">Select Payment Method</h2>
    <br />

    <div class="bg-base-300 rounded-box max-h-72 overflow-y-auto">
      <div class="flex">
        <table class="table table-zebra">
          <tbody>
            @for (pay of paymentMethods; track $index) {
            <tr class="h-12">
              <td>
                <label class="label cursor-pointer flex justify-between">
                  <span class="label-text text-xl">
                    {{ pay.name }}
                  </span>
                  <input type="radio" name="payments" class="radio" [checked]="this.selectedOption == pay" [value]="pay" [(ngModel)]="selectedOption" />
                </label>
              </td>
            </tr>
            }
            <tr class="h-12">
              <td>
                <label class="label cursor-pointer flex justify-between">
                  <span class="label-text text-xl">
                    <fa-icon [icon]="['fab', googlePay.icon!]"></fa-icon> {{ googlePay.name }}
                  </span>
                  <input type="radio" name="payments" class="radio" [checked]="this.selectedOption == googlePay" [value]="googlePay" [(ngModel)]="selectedOption" />
                </label>
              </td>
            </tr>
            <tr class="h-12">
              <td>
                <label class="label cursor-pointer flex justify-between">
                  <span class="label-text text-xl">
                    <fa-icon [icon]="['fab', applePay.icon!]"></fa-icon> {{ applePay.name }}
                  </span>
                  <input type="radio" name="payments" class="radio" [checked]="this.selectedOption == applePay" [value]="applePay" [(ngModel)]="selectedOption" />
                </label>
              </td>
            </tr>
            <tr class="h-12">
              <td>
                <label class="label cursor-pointer flex justify-between">
                  <span class="label-text text-xl">
                    <fa-icon [icon]="['fab', payPal.icon!]"></fa-icon> {{ payPal.name }}
                  </span>
                  <input type="radio" name="payments" class="radio" [checked]="this.selectedOption == payPal" [value]="payPal" [(ngModel)]="selectedOption" />
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="flex justify-between mt-1">
      <button class="btn btn-soft btn-warning btn-sm">
        <fa-icon icon="circle-plus"></fa-icon> Add New Payment method
      </button>
      <button class="btn btn-soft btn-sm">Manage</button>
    </div>
    <br />

    @if (!isLoggedIn) {
    <p>It appears that you are not signed in?</p>
    <button class="btn btn-ghost" (click)="promptLogin()">Login</button>
    }
  </div>

  <div mat-dialog-actions class="flex flex-col gap-2">
    <button class="btn btn-neutral w-full" (click)="onSave()">
      Save
    </button>
    <button class="btn bg-base-100 w-full" (click)="onClose()">
      Cancel
    </button>
  </div>
</div>
`
})
export class PaymentMethodDialog {

  static readonly GooglePay: IPayMethod = {
    name: 'Google Pay',
    icon: 'google-pay',
    type: 'GooglePay'
  };


  static readonly ApplePay: IPayMethod = {
    name: 'Apple Pay',
    icon: 'apple-pay',
    type: 'ApplePay'
  };

  static readonly PayPal: IPayMethod = {
    name: 'Pay Pal',
    icon: 'paypal',
    type: 'PayPal'
  };

  readonly googlePay = PaymentMethodDialog.GooglePay;
  readonly applePay = PaymentMethodDialog.ApplePay;
  readonly payPal = PaymentMethodDialog.PayPal;

  protected paymentMethods: IPayMethod[] = [];
  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;
  protected selectedOption?: IPayMethod;

  protected get isLoggedIn() {
    return this.userService.isLoggedIn();
  }

  constructor(
    private dialogRef: MatDialogRef<PaymentMethodDialog>,
    private dialog: MatDialog,
    private userService: UserService,
    private deliveryService: DeliveryService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;
      this.selectedOption = data.payment;
      this.cdr.detectChanges();
    });

    this.userService.user$.subscribe(data => {
      this.paymentMethods = data.savedPayMethods ? data.savedPayMethods : [];
      this.cdr.detectChanges();
    });
  }

  protected promptLogin() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = undefined;
    dialogConfig.height = "90%";
    const dialogRef = this.dialog.open(SignInDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected onSave() {
    this.deliverySettings.payment = this.selectedOption;
    this.deliveryService.setDeliverySetting(this.deliverySettings);

    this.dialogRef.close();
  }

  protected onClose() {
    this.dialogRef.close();
  }
}