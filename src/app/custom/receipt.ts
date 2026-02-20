import { DatePipe, DecimalPipe, KeyValuePipe } from "@angular/common";
import { ChangeDetectorRef, Component, Inject, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Cart, CartService } from "../checkout/cart";
import { Tip } from "../checkout/order";
import { IItem, Item } from "../content/item";
import { IDeliverySettings, AddressBook, DeliveryService, AddressBookDialog, DeliveryMode } from "../header/addressBook";
import { IOrderHistory } from "../user/order-history";
import { ISubscription, Subscribe } from "./subscribe";
import { SubscribeItemList } from "./subscribeItemList";
import { provideNativeDateAdapter } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatDialogModule, MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatDialogConfig } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSnackBar } from "@angular/material/snack-bar";
import { RouterModule, Router } from "@angular/router";
import { UserService } from "../user/user";

@Component({
  selector: 'receipt',
  imports: [FormsModule, FontAwesomeModule, DecimalPipe, Tip],
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
      ? Tip.getAmount(this.getSubTotal(), this.deliverySettings.tip, this.deliverySettings.tipAmount)
      : 0;
  }

  protected getTotal(): number {
    return this.getSubTotal() + this.getServiceFee() + this.getDeliveryFee() + (this.getGST() + this.getPST()) + this.getTipAmounmt() - this.getCouponDiscount();
  }

  protected getCustomText(): string {
    if (this.order) {
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


@Component({
  providers: [provideNativeDateAdapter()],
  imports: [FormsModule, FontAwesomeModule, RouterModule, KeyValuePipe, DatePipe, MatDialogModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, Receipt],
  template: `
<div class="bg-base-200">
  <div mat-dialog-content>    
    <div class="flex flex-col gap-2">
      <h1 class="text-xl font-bold">Delivery Address:</h1>

      <div class="bg-base-300 rounded-box flex justify-between items-center gap-2 p-2">
        <div class="flex gap-2 p-2 items-center">
          <fa-icon [class]="deliverySettings.address ? '' : 'text-error'" icon="home"></fa-icon>
          <a [class]="'link flex flex-col ' + (deliverySettings.address ? '' : 'text-error')" style="text-decoration: none;">
            <p [class]="deliverySettings.address ? 'font-bold' : ''">{{ deliverySettings.address ? deliverySettings.address.addressLine : 'Add delivery address' }}</p>
            @if (deliverySettings.address) {
            <p class="text-sm">{{ deliverySettings.address.province }}, {{ deliverySettings.address.postal }}</p>
            }
          </a>
        </div>
        <button [class]="'btn btn-sm shadow ' + (!deliverySettings.address ? 'btn-outline btn-error' : '')" (click)="openAddressBookDialog()">Edit</button>
      </div>
    </div>
    <br />

    <div class="flex flex-col gap-2">
      <h1 class="text-xl font-bold">Delivery Dates:</h1>

      <mat-form-field class="w-full">
        <mat-label>Start date</mat-label>
        <input tabindex="-1" matInput [matDatepicker]="picker" [(ngModel)]="selectedDate">
        <mat-hint class="text-gray-500 font-mono">MM/DD/YYYY</mat-hint>
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker touchUi #picker></mat-datepicker>
      </mat-form-field>
      
      <div class="bg-base-300 rounded-box flex flex-col p-4">
        <h2 class="font-bold">Your delivery dates:</h2>
        <div class="flex flex-col gap-2 font-mono">
          @for (day of data.days | keyvalue; track day.key) {
          <p>{{ selectedDate | date }} - {{ day.value.name }}</p>
          }
          <p>...</p>
        </div>
      </div>
    </div>
    <br />
    
    <div class="flex flex-col gap-2">
      <h1 class="text-xl font-bold">Payment:</h1>

      <div class="bg-base-300 rounded-box flex justify-between items-center gap-2 p-2">
        <div class="flex gap-2 p-2 items-center">
          <fa-icon [class]="deliverySettings.payment ? '' : 'text-error'" icon="credit-card"></fa-icon>
          <a [class]="'link flex flex-col ' + (deliverySettings.payment ? '' : 'text-error')" style="text-decoration: none;">
            <p [class]="deliverySettings.payment ? 'font-bold' : ''">{{ deliverySettings.payment ? deliverySettings.payment.name : 'Select Payment method' }}</p>
            @if (deliverySettings.payment) {
            <p class="text-sm">Visa **** **** **** {{ getLastFourDigits(deliverySettings.payment.cardNumber) }}</p>
            }
          </a>
        </div>
        <button [class]="'btn btn-sm shadow ' + (!deliverySettings.payment ? 'btn-outline btn-error' : '')" (click)="openPaymentMethodDialog()">Edit</button>
      </div>
    </div>
    <br />
    
    <div class="flex flex-col gap-2">
      <h1 class="text-xl font-bold">Order Summary:</h1>
      <div class="bg-base-300 rounded-box p-4">
        <receipt [subscription]="data"></receipt>
      </div>
      <p><b>Payment:</b> The Total amount shown will be deducted on each delivery day. You will be notified via email/message.</p>
      <p><b>Cancelation:</b> You can cancel this subscription whenever you like. The order payment will be deducted if the cancelation is done the day before or the day of delivery. All your Subscriptions are visible in "Subscriptions" category in Homepage side drawer (<fa-icon icon="bars"></fa-icon>).</p>
    </div>
  </div>

  <div mat-dialog-actions class="grid gap-2">
    <button class="btn btn-warning w-full" (click)="checkout()">Add Subscription</button>
    <button class="btn btn-soft w-full" (click)="closeDialog()">Cancel</button>
  </div>
</div>
`
})
export class CheckoutDialog {

  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;

  protected selectedDate: Date = new Date();

  protected get selectedItems(): IItem[] {
    return SubscribeItemList.getSelectedItems(this.data.category);
  }

  protected get totalItems(): number {
    let num: number = 0;
    for (let item of this.selectedItems) {
      num += item.amount;
    }
    return num;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) protected data: ISubscription,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<CheckoutDialog>,
    private deliveryService: DeliveryService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef) {
  }

  protected getLastFourDigits(cardNumber: string): string {
    return cardNumber.slice(-4);
  }

  protected ngOnInit() {
    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;
      this.cdr.detectChanges();
    });
  }

  protected openAddressBookDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = { timeslot: false };
    dialogConfig.width = '90%';

    const dialogRef = this.dialog.open(AddressBookDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected openPaymentMethodDialog() {
    this.deliverySettings.payment = { name: "TIGHT", cardNumber: "0000000000001234" };
    this.deliveryService.setDeliverySetting(this.deliverySettings);
  }

  protected checkout() {
    if (!this.deliverySettings.payment) {
      this.snackBar.open("No payment method found.", "Close", {
        duration: 2500
      });
      return;
    }

    this.data.date = this.selectedDate;
    this.data.payment = this.deliverySettings.payment;
    this.data.address = this.deliverySettings.address;
    this.userService.addSubscription(this.data);

    this.snackBar.open("Subscription added successfully.", "Close", {
      duration: 2500
    });

    this.router.navigate(['/subscriptions']);

    this.closeDialog();
  }

  protected closeDialog() {
    this.dialogRef.close();
  }
}