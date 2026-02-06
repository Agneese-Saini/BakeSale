import { DatePipe, DecimalPipe, KeyValuePipe } from "@angular/common";
import { ChangeDetectorRef, Component, EventEmitter, Inject, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Category, CategoryService, ICategory, ICustomizer } from "../header/category";
import { IItem, Item } from "../content/item";
import { PriceTag, TextReadMore } from "../content/itemDialog";
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from "@angular/material/snack-bar";
import { provideNativeDateAdapter } from '@angular/material/core';
import { IPayMethod, UserService } from "../user/user";
import { IDeliverySettings, AddressBook, DeliveryService } from "../header/delivery";
import { OrderTotal } from "../checkout/order";
import { CdkAriaLive } from "../../../node_modules/@angular/cdk/types/_a11y-module-chunk";

export interface ISubscription {
  category: ICategory,
  freq: number,
  days: DaysOfWeekSetting,
  canceledDays?: Date[],
  date?: Date,
  payment?: IPayMethod
};

export enum DaysOfWeek {
  Monday,
  Tuesday,
  Wednessday,
  Thursday,
  Friday,
  Saturday,
  Sunday
};

export type DaysOfWeekSetting = Map<DaysOfWeek, { name: string, checked: boolean, label: string }>;


@Component({
  selector: 'subscribe-item-list',
  imports: [FormsModule, FontAwesomeModule, RouterModule, PriceTag, MatDialogModule],
  template: `
<div class="flex flex-col">
  <label class="input w-full">
    <svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.3-4.3"></path>
      </g>
    </svg>
    <input type="search" class="grow placeholder-gray-500 input-lg" placeholder="Search" />
  </label>
</div>
<br />

<div class="flex justify-between items-center gap-2 pb-1">
  <h1 class="text-lg font-semibold">Select items:</h1>
   
  @if (error) {
  <p class="badge badge-soft badge-error px-1">
    <fa-icon icon="exclamation-circle"></fa-icon> {{ error }}
  </p>
  }
  @else if (totalItems > 0) {
  <p class="text-neutral text-lg">
    {{ totalItems }} {{ totalItems == 1 ? 'item' : 'items'}} - <b>{{ '$' }}{{ itemsPrice }}</b>
  </p>
  }
  @else {
  <i class="label">Minimum Required {{ minimumItemCount }}</i>
  }
</div>

<div [class]="'overflow-y-auto rounded-box w-full' + ' ' + (maxHeight ? ('max-h-' + maxHeight) : '')">
  <table class="table table-zebra">
    <tbody>
      @for (item of category.items; track item) {
      <tr>
        <td class="flex justify-between items-center">
          <div class="flex gap-2 items-center lg:items-start">
            <div class="indicator">
              <div class="w-18 lg:w-32">
                <img class="rounded-box link w-full h-18 lg:h-32" [src]="getImage(item)" (click)="openItemDialog(item)" />

                <div class="indicator-item indicator-start" style="--indicator-x: -0.5em; --indicator-y: 1.25em;">
                  <div class="flex flex-col gap-1">
                    @if (item.company) {
                    <span class="bg-neutral text-xs lg:text-sm text-white font-bold font-serif w-fit px-1">
                      {{ item.company }}
                    </span>
                    }
                  </div>
                </div>
              </div>
            </div>

            <div
              [class]="'flex flex-col w-full ' + ((item.stockAmount != undefined && item.stockAmount == 0) ? 'text-gray-500' : '')">
              <!-- Name -->
              <a class="link flex gap-2 items-center text-lg w-fit" style="text-decoration: none;"
                (click)="openItemDialog(item)">
                {{ item.name }}
              </a>

              <!-- warning -->
              @if (item.stockAmount != undefined && item.stockAmount == 0) {
              <span class="badge-xs badge-error badge text-white">out of stock</span>
              }

              <!-- Price -->
              <item-price-tag [value]="item" size="sm" [showSale]="true" saleSize="sm"></item-price-tag>

              <!-- Label -->
              @if (item.label) {
              <span class="text-xs px-2 pb-2 whitespace-pre-line">{{ item.label }}</span>
              }
            </div>
          </div>

          <div class="flex items-center gap-2">
            @if (item.amount > 0) {
            <button class="btn btn-sm btn-ghost btn-circle" (click)="decrease(item)">
              @if (item.amount == 1) {
              <fa-icon class="text-error" icon="trash"></fa-icon>
              } @else {
              <fa-icon icon="minus"></fa-icon>
              }
            </button>

            <b class="text-lg">{{ item.amount }}</b>
            }

            <button [class]="'btn btn-sm btn-ghost btn-circle ' + (item.amount == 0 ? 'btn-soft' : '')" (click)="increase(item)">
              <fa-icon icon="plus"></fa-icon>
            </button>
          </div>
        </td>
      </tr>
      }
    </tbody>
  </table>
</div>
`
})
export class SubscribeItemList {

  protected readonly minimumItemCount: number = Subscribe.MinimumItemCount;
  
  @Input({ required: true })
  public category!: ICategory;

  @Input()
  public error?: string;

  @Input()
  public maxHeight?: number;

  @Output()
  public change = new EventEmitter<void>();

  protected get selectedItems(): IItem[] {
    return SubscribeItemList.getSelectedItems(this.category);
  }

  protected get totalItems(): number {
    let num: number = 0;
    for (let item of this.selectedItems) {
      num += item.amount;
    }
    return num;
  }

  protected get itemsPrice(): number {
    let num: number = 0;
    for (let item of this.selectedItems) {
      num += Item.getPrice(item);
    }
    return num;
  }

  protected getImage = Item.getImage;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef) { }

  protected openItemDialog(item: IItem) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = item;
    dialogConfig.width = '90%';

    const dialogRef = this.dialog.open(ItemInfoDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected increase(item: IItem) {
    if (item.amount == item.maxAmount) {
      this.snackBar.open("Max allowed: " + item.maxAmount, "Close", {
        duration: 2500
      });
      return;
    }

    item.amount += 1;
    this.change.emit();
  }

  protected decrease(item: IItem) {
    if (item.amount == 0) return;

    item.amount -= 1;
    this.change.emit();
  }

  static getSelectedItems(category: ICategory): IItem[] {
    let items: IItem[] = [];

    if (category.items) {
      for (let item of category.items) {
        if (item.amount > 0) {
          items.push(item);
        }
      }
    }
    return items;
  }
}


@Component({
  selector: 'subscribe-order-summary',
  imports: [FormsModule, FontAwesomeModule, DecimalPipe],
  template: `
@for (item of selectedItems; track item) {
<div class="flex justify-between items-center">
  <b>{{ item.name }} {{ item.amount > 1 ? ('(' + item.amount + ')') : '' }}</b>
  <div class="flex gap-2 items-center">
    @if (item.price.previousPrice) {
    <p class="label line-through">{{ '$' }}{{ getPrice(item, item.price.previousPrice) | number: '1.1-2' }}</p>
    }
    <p>{{ '$' }}{{ getPrice(item) | number: '1.2-2' }}</p>
  </div>
</div>
}

<div class="divider px-2"></div>

<div class="flex justify-between">
  <P>SubTotal:</P>
  <div class="flex flex-col items-end justify-end">
    <div class="flex gap-2">
      <p class="label line-through">{{ '$' }}{{ (getSubTotal() + getSavings()) | number: '1.2-2' }}</p>
      <b>{{ '$' }}{{ getSubTotal() | number: '1.2-2' }}</b>
    </div>
    @if (getSavings() != 0) {
    <p class="text-right text-success"> Saving: {{ '$' }}{{ getSavings() | number: '1.2-2' }}</p>
    }
  </div>
</div>

<div class="flex justify-between items-center pt-1">
  <p>Taxes:</p>
  <p>{{ '$' }}{{ getTaxes() | number: '1.2-2' }}</p>
</div>
<div class="flex justify-between items-center">
  <p>Service Fee:</p>
  <p>{{ '$' }}{{ getServiceFee() | number: '1.2-2' }}</p>
</div>
<div class="flex justify-between items-center">
  <p>Delivery Fee:</p>
  @if (getDeliveryFee() == 0) {
  <p class="text-success">Free</p>
  } @else {
  <p>{{ '$' }}{{ getDeliveryFee() | number: '1.2-2' }}</p>
  }
</div>

<div class="divider px-2"></div>

<div class="flex justify-between gap-4">
  <b>Total:</b>
  <b>{{ '$' }}{{ getTotal() | number: '1.2-2' }}</b>
</div>
<p class="text-sm text-right">/per delivery</p>
`
})
export class SubscribeOrderSummary {

  @Input({ required: true })
  public subscription!: ISubscription;

  protected get selectedItems(): IItem[] {
    return SubscribeItemList.getSelectedItems(this.subscription.category);
  }

  protected getAmount = Item.getAmount;
  protected getPrice = Item.getPrice;

  protected getSubTotal(): number {
    return Subscribe.getSubTotal(this.subscription);
  }

  protected getSavings(): number {
    return Subscribe.getSavings(this.subscription);
  }

  protected getTaxes(): number {
    return Subscribe.getTaxes(this.subscription);
  }

  protected getServiceFee(): number {
    return Subscribe.getServiceFee(this.subscription);
  }

  protected getDeliveryFee(): number {
    return Subscribe.getDeliveryFee(this.subscription);
  }

  protected getTotal(): number {
    return Subscribe.getTotal(this.subscription);
  }
}


@Component({
  selector: 'subscribe',
  imports: [FormsModule, FontAwesomeModule, RouterModule, KeyValuePipe, MatDialogModule, SubscribeItemList],
  templateUrl: "subscribe.html"
})
export class Subscribe {

  static readonly MinimumItemCount = 2;

  protected readonly numDaysLimit: number = 5;
  protected readonly defaultCategory = Category.DefaultCategory;

  protected readonly deliveryFrequencies: number[] = [
    1, 2, 3, 4
  ];

  protected daysOfWeekSetting: DaysOfWeekSetting = new Map([
    [DaysOfWeek.Monday, { name: "Monday", checked: false, label: "MON" }],
    [DaysOfWeek.Tuesday, { name: "Tuesday", checked: false, label: "TUE" }],
    [DaysOfWeek.Wednessday, { name: "Wednessday", checked: false, label: "WED" }],
    [DaysOfWeek.Thursday, { name: "Thursday", checked: false, label: "THU" }],
    [DaysOfWeek.Friday, { name: "Friday", checked: false, label: "FRI" }],
    [DaysOfWeek.Saturday, { name: "Saturday", checked: false, label: "SAT" }],
    [DaysOfWeek.Sunday, { name: "Sunday", checked: false, label: "SUN" }]
  ]);

  protected category?: ICategory;
  protected selectedItemsError?: string;
  protected selectedDeliveryFrequency: number = this.deliveryFrequencies[0];
  protected selectedDeliveryDaysError?: string;

  protected get customizer(): ICustomizer {
    return this.category!.customizer!;
  }

  protected get totalSelectedItems(): number {
    let num: number = 0;
    if (this.category) {
      for (let item of SubscribeItemList.getSelectedItems(this.category)) {
        num += item.amount;
      }
    }
    return num;
  }

  protected get selectedDeliveryDays(): DaysOfWeekSetting {
    let ret: DaysOfWeekSetting = new Map();
    for (let [key, value] of this.daysOfWeekSetting) {
      if (value.checked) {
        ret.set(key, value);
      }
    }

    return ret;
  }

  protected get selectedDays(): string {
    const last = [...this.selectedDeliveryDays.keys()].at(-1);

    let ret: string = "";
    for (let [key, value] of this.selectedDeliveryDays) {
      ret += value.label;
      if (key != last) {
        ret += ", ";
      }
    }

    return ret;
  }

  protected get numDays(): number {
    let num: number = 0;
    for (let [key, value] of this.daysOfWeekSetting) {
      num += value.checked ? 1 : 0;
    }
    return num;
  }

  constructor(
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    const type = this.route.snapshot.paramMap.get('type');
    if (type) {
      this.categoryService.categories$.subscribe(data => {
        for (let cat of data) {
          let find = this.findCustomizer(cat, type);
          if (find != undefined) {
            this.category = structuredClone(find);
            break;
          }
        }

        this.cdr.detectChanges();
      });
    }
  }

  protected findCustomizer(category: ICategory, type: string): ICategory | undefined {
    if (category.customizer && category.customizer.name == type) {
      return category;
    }

    if (category.subcats) {
      for (let subcat of category.subcats) {
        const find = this.findCustomizer(subcat, type);
        if (find != undefined) {
          return find;
        }
      }
    }

    return undefined;
  }

  protected onDaysChange() {
    this.selectedDeliveryDaysError = undefined;
  }

  protected proceed() {
    if (!this.category) return;

    if (this.totalSelectedItems < Subscribe.MinimumItemCount) {
      this.selectedItemsError = "Minimum Required " + Subscribe.MinimumItemCount;
    }

    if (this.selectedDeliveryDays.size == 0) {
      this.selectedDeliveryDaysError = "Required";
    }

    if (this.selectedItemsError || this.selectedDeliveryDaysError) {
      this.snackBar.open("Please fix errors before proceeding.", "Close", {
        duration: 2500
      });
      return;
    }

    const data: ISubscription = {
      category: this.category,
      days: this.selectedDeliveryDays,
      freq: this.selectedDeliveryFrequency
    };

    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = data;
    dialogConfig.width = '90%';

    const dialogRef = this.dialog.open(CheckoutDialog, dialogConfig);
    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  static getTotalItems(items: IItem[]): number {
    let num: number = 0;
    for (let item of items) {
      num += item.amount;
    }
    return num;
  }

  static getSubTotal(sub: ISubscription): number {
    let subtotal: number = 0;
    for (let item of SubscribeItemList.getSelectedItems(sub.category)) {
      subtotal += Item.getPrice(item);
    }
    return subtotal;
  }

  static getSavings(sub: ISubscription): number {
    let originalTotal: number = 0;
    for (let item of SubscribeItemList.getSelectedItems(sub.category)) {
      originalTotal += Item.getPrice(item, item.price.previousPrice ? item.price.previousPrice : item.price.value);
    }
    return originalTotal - Subscribe.getSubTotal(sub);
  }

  static getTaxes(sub: ISubscription): number {
    const subtotal = Subscribe.getSubTotal(sub);
    const GST = subtotal * (OrderTotal.GST_Rate / 100);
    const PST = subtotal * (OrderTotal.PST_Rate / 100);
    return GST + PST;
  }

  static getServiceFee(sub: ISubscription): number {
    const selectedItems = SubscribeItemList.getSelectedItems(sub.category);
    const totalItems = Subscribe.getTotalItems(selectedItems);
    return 0.65 * totalItems * ((totalItems > 4) ? 0.83 : 1.0);
  }

  static getDeliveryFee(sub: ISubscription): number {
    return 0.0;
  }

  static getTotal(sub: ISubscription): number {
    return Subscribe.getSubTotal(sub) + Subscribe.getServiceFee(sub) + Subscribe.getTaxes(sub);
  }
}


@Component({
  imports: [FormsModule, FontAwesomeModule, MatDialogModule, TextReadMore],
  template: `
<div class="bg-base-200">
  <h1 mat-dialog-title>{{ data.name }}</h1>

  <div mat-dialog-content>
    <div class="flex flex-col gap-4 items-center pt-4">
      <div class="rounded-box flex bg-base-300 justify-center w-full">
        <img class="h-56" [src]="displayImage" />
      </div>
      <div class="flex flex-wrap justify-center gap-2">
        @for (img of data.image; track img) {
        <img [class]="'link rounded-box h-12 w-12 ' + (displayImage == img ? 'ring ring-2' : '')" [src]="img"
          (click)="selectImage(img)" />
        }
      </div>
    </div>
    <br />

    @if (data.ingredients) {
    <b>Ingredients:</b>
    <text-read-more class="px-2" [text]="data.ingredients" [maxLength]="150"></text-read-more>
    <br />
    }
  </div>
  <br />

  <div mat-dialog-actions>
    <button class="btn btn-neutral w-full" (click)="closeDialog()">Close</button>
  </div>
</div>
`
})
export class ItemInfoDialog {

  protected displayImage?: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) protected data: IItem,
    private dialogRef: MatDialogRef<ItemInfoDialog>) { }

  protected ngOnInit() {
    this.displayImage = Item.getImage(this.data);
  }

  protected selectImage(image: string) {
    this.displayImage = image;
  }

  protected closeDialog() {
    this.dialogRef.close();
  }
}


@Component({
  providers: [provideNativeDateAdapter()],
  imports: [FormsModule, FontAwesomeModule, RouterModule, KeyValuePipe, DatePipe, MatDialogModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, SubscribeOrderSummary],
  template: `
<div class="bg-base-200">
  <div mat-dialog-content>
    <div class="flex flex-col gap-2">
      <h1 class="text-xl font-bold">Delivery Dates:</h1>

      <mat-form-field class="w-full">
        <mat-label>Start date</mat-label>
        <input matInput [matDatepicker]="picker" [(ngModel)]="selectedDate">
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
        <subscribe-order-summary [subscription]="data"></subscribe-order-summary>
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
    private dialogRef: MatDialogRef<CheckoutDialog>,
    private deliveryService: DeliveryService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef) {
  }

  protected getAmount = Item.getAmount;
  protected getPrice = Item.getPrice;

  protected getSubTotal(): number {
    return Subscribe.getSubTotal(this.data);
  }

  protected getSavings(): number {
    return Subscribe.getSavings(this.data);
  }

  protected getTaxes(): number {
    return Subscribe.getTaxes(this.data);
  }

  protected getServiceFee(): number {
    return Subscribe.getServiceFee(this.data);
  }

  protected getDeliveryFee(): number {
    return Subscribe.getDeliveryFee(this.data);
  }

  protected getTotal(): number {
    return Subscribe.getTotal(this.data);
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