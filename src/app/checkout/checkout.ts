import { ChangeDetectorRef, Component } from '@angular/core';
import { AddressBook, AddressBookDialog, DeliveryService, DeliveryType, IDeliverySettings } from '../header/delivery';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DeliveryMode } from '../header/delivery';
import { CartService, Cart, EmptyCartLinks } from './cart';
import { KeyValuePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { TimeslotsDialog } from '../header/timeslots';
import { Router, RouterModule } from '@angular/router';
import { CartItemList } from './cartItemDialog';
import { IOrderHistory } from '../user/order-history';
import { UserService } from '../user/user';
import { ItemChoiceList } from '../content/itemChoice';
import { OrderTotal, Tip } from "./order";

export enum DriverTip {
  Tip_10 = 10,
  Tip_15 = 15,
  Tip_20 = 20,
  Tip_30 = 30,
  Tip_Custom = 0
};

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
                <b>{{ deliverySettings.address.addressLine }}</b>
                <p class="text-sm">{{ deliverySettings.address.city }}, {{ deliverySettings.address.province }} {{
                  deliverySettings.address.postal }}</p>
              </a>
              } @else {
              <a class="link text-error" style="text-decoration: none;" (click)="openAddressBookDialog()">
                Enter Address
              </a>
              }
              } @else {
              @if (deliverySettings.address) {
              <label class="flex flex-col">
                <b>{{ deliverySettings.address.addressLine }}</b>
                <p class="text-sm">{{ deliverySettings.address.city }}, {{ deliverySettings.address.province }} {{
                  deliverySettings.address.postal }}</p>
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
                  {{ deliveryMode.label }} Time:
                </p>
                <b>{{ deliverySettings.timeslot.label }}</b>
                @if (deliverySettings.timeslot.slots && deliverySettings.timeslot.slots.length > 1) {
                <p class="text-sm">
                  Between <b>{{ deliverySettings.time?.start }}</b> - <b>{{ deliverySettings.time?.end }}</b>
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
        <fa-icon [class]="deliverySettings.payment ? '' : 'text-error'" icon="credit-card"></fa-icon>
        <a [class]="'link flex flex-col ' + (deliverySettings.payment ? '' : 'text-error')" style="text-decoration: none;">
          <p [class]="deliverySettings.payment ? 'font-bold' : ''">{{ deliverySettings.payment ? deliverySettings.payment.name : 'Select Payment method' }}</p>
          @if (deliverySettings.payment) {
          <p class="text-sm">Visa **** **** **** 9609</p>
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
  }

  protected openTimeslotsDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";

    const dialogRef = this.dialog.open(TimeslotsDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected openAddressBookDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = undefined;

    const dialogRef = this.dialog.open(AddressBookDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected openDeliveryInstructionsDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";

    const dialogRef = this.dialog.open(DeliveryInstructionsDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected openPaymentMethodDialog() {
    this.deliverySettings.payment = { name: "TIGHT" };
    this.deliveryService.setDeliverySetting(this.deliverySettings);
  }
}


@Component({
  selector: 'checkout-cart',
  imports: [FormsModule, FontAwesomeModule, KeyValuePipe, CartItemList],
  template: `
<div class="collapse collapse-arrow bg-base-200 shadow-lg p-2">
  <input type="checkbox" />
  <div class="collapse-title">
    <div class="flex gap-2 justify-between items-center text-xl">
      <div class="flex gap-2 text-xl">
        <fa-icon icon="shopping-cart"></fa-icon>
        <b class="font-semibold">Cart</b>
      </div>

      <p class="font-thin text-xl"><b>{{ totalItems }}</b> {{ (totalItems > 1) ? 'Items' : 'Item' }}</p>
    </div>
  </div>

  <div class="collapse-content">
    <div class="rounded-box bg-base-100">
      @for (cartItem of shoppingCart | keyvalue; track cartItem.key) {
      <cart-item-list [items]="cartItem.value" />
      }
    </div>
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
  imports: [FormsModule, FontAwesomeModule, RouterModule, CheckoutCoupon, CheckoutDetails, OrderTotal, EmptyCartLinks, CheckoutCart, OrderTotal],
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

  constructor(
    private deliveryService: DeliveryService,
    private cartService: CartService,
    private userService: UserService,
    private snackBar: MatSnackBar,
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
    const hasError = this.showChoiceErrors();
    if (hasError || this.showDetailErrors()) {
      this.snackBar.open("Please fix the errors before proceeding.", "Close", {
        duration: 2500
      });
      return;
    }

    let order: IOrderHistory = {
      tipAmount: this.deliverySettings.mode == DeliveryMode.Delivery ? Tip.getAmount(this.shoppingCart, this.deliverySettings.tip, this.deliverySettings.tipAmount) : 0,
      deliveryType: this.deliverySettings.mode == DeliveryMode.Delivery ? this.deliverySettings.deliveryType : undefined,
      deliveryInstructions: this.deliverySettings.deliveryInstructions,
      gstPercentage: OrderTotal.GST_Rate,
      pstPercentage: OrderTotal.PST_Rate,
      couponDiscount: this.couponDiscount,
      cart: structuredClone(this.shoppingCart),
      date: Date.now(),
      time: this.deliverySettings.time!,
      address: this.deliverySettings.address!,
      payment: this.deliverySettings.payment!
    };

    this.userService.addOrder(order);
    this.shoppingCart.clear();
    this.router.navigate(['/']);

    this.snackBar.open("Order placed!", "Close", {
      duration: 2500
    });
  }
}


@Component({
  imports: [FormsModule, FontAwesomeModule, KeyValuePipe],
  template: `
<div class="flex flex-col bg-base-200 min-w-84 p-4">
  <h2 mat-dialog-title class="text-4xl font-bold">Delivery Options</h2>
  <br />

  <label>Address:</label>
  <p class="px-2 font-mono">
    <b>{{ deliverySettings.address!.addressLine }}</b>
    @if (deliverySettings.address!.buildingType) {
    <br/>
    <fa-icon class="pr-2" icon="house"></fa-icon> <b>{{ deliverySettings.address!.buildingType }}</b>
    }
  </p>
  
  <div class="bg-base-300 rounded-box mt-2 overflow-x-auto">
    <div class="flex h-64 overflow-x-auto p-2">
      <table class="table table-zebra">
        <tbody>
          @for (type of deliveryType | keyvalue; track type) {
          <tr class="h-16">
            <td>
              <label class="label cursor-pointer flex justify-between">
                <span class="label-text text-xl">
                  {{ type.value }}
                </span>
                <input type="radio" name="times" class="radio" [checked]="this.selectedOption == type.value" [value]="type.value" [(ngModel)]="selectedOption" />
              </label>
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>
  </div>
  <br />

  <label class="text-xl">Special Instructions:</label>
  <label class="text-gray-500">Write an instruction for your delivery driver:</label>
  <input class="input placeholder-gray-500" type="search" placeholder="e.g. Don't ring the door bell." [(ngModel)]="instructions" />
  <br />

  <div class="grid items-stretch pt-4">
    <button class="btn btn-neutral m-1" (click)="onSave()">
      Save
    </button>
    <button class="btn bg-base-100 m-1" (click)="onClose()">
      Cancel
    </button>
  </div>
</div>
`
})
export class DeliveryInstructionsDialog {

  protected readonly deliveryType = DeliveryType;

  protected selectedOption: DeliveryType = DeliveryType.LeaveAtDoor;
  protected instructions?: string;

  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;

  constructor(
    private deliveryService: DeliveryService,
    private dialogRef: MatDialogRef<TipAmountDialog>,
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
  imports: [FormsModule, FontAwesomeModule],
  template: `
<div class="bg-base-200 min-w-84 p-4">
  <h2 mat-dialog-title class="text-4xl font-bold">Enter tip amount</h2>
  <br />

  <label class="input input-lg">
    <fa-icon icon="dollar"></fa-icon>
    <input type="number" class="grow placeholder-gray-500" placeholder="Tip amount" [(ngModel)]="amount" />
  </label>
  <br />

  <div class="grid items-stretch pt-4">
    <button class="btn btn-neutral m-1" (click)="onSave()">
      Save
    </button>
    <button class="btn bg-base-100 m-1" (click)="onClose()">
      Cancel
    </button>
  </div>
</div>
`
})
export class TipAmountDialog {

  protected amount: number = 0.0;

  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;

  constructor(
    private deliveryService: DeliveryService,
    private dialogRef: MatDialogRef<TipAmountDialog>,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;
      this.cdr.detectChanges();

      if (data.tipAmount) {
        this.amount = data.tipAmount;
      }
    });
  }

  protected onSave() {
    if (this.amount < 0) {
      this.amount = 0.0;
    }

    this.deliverySettings.tip = DriverTip.Tip_Custom;
    this.deliverySettings.tipAmount = this.amount;
    this.deliveryService.setDeliverySetting(this.deliverySettings);

    this.dialogRef.close();
  }

  protected onClose() {
    this.dialogRef.close();
  }
};

