import { DatePipe, DecimalPipe, KeyValuePipe } from "@angular/common";
import { ChangeDetectorRef, Component, Inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Category, CategoryService, ICategory } from "../header/category";
import { IItem, Item } from "../content/item";
import { PriceTag, TextReadMore } from "../content/itemDialog";
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from "@angular/material/snack-bar";
import { provideNativeDateAdapter } from '@angular/material/core';
import { CartItemsDialog } from "../checkout/cartItemDialog";
import { UserService } from "../user/user";
import { IDeliverySettings, AddressBook, DeliveryService } from "../header/delivery";
import { OrderTotal } from "../checkout/order";

export enum DaysOfWeek {
  Monday,
  Tuesday,
  Wednessday,
  Thursday,
  Friday,
  Saturday,
  Sunday
};

export interface ISubscriptionPlanSetting {
  name: string,
  weeks: number,
  fee: number,
  discountPercent?: number
};

export type DaysOfWeekSetting = Map<DaysOfWeek, { name: string, checked: boolean, label: string }>;

@Component({
  selector: 'subscribe',
  imports: [FormsModule, FontAwesomeModule, RouterModule, KeyValuePipe, PriceTag, MatDialogModule],
  templateUrl: "subscribe.html"
})
export class Subscribe {

  protected readonly minimumItemCount = 2;
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

  protected category: ICategory = this.defaultCategory;
  protected selectedItems: IItem[] = [];
  protected selectedDeliveryFrequency: number = this.deliveryFrequencies[0];
  protected selectedItemsError?: string;
  protected selectedDeliveryDaysError?: string;

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

  protected get totalSelectedItems(): number {
    let num: number = 0;
    for (let item of this.selectedItems) {
      num += item.amount;
    }
    return num;
  }

  protected getImage = Item.getImage;

  constructor(
    private route: ActivatedRoute,
    private categoryService: CategoryService,
    private userService: UserService,
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
            this.category = find;

            if (this.category.items) {
              for (let item of this.category.items) {
                item.amount = 0;
              }
            }
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

  protected openItemDialog(item: IItem) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = item;

    const dialogRef = this.dialog.open(SubscribeItemDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected onDaysChange() {
    this.selectedDeliveryDaysError = undefined;
  }

  protected increase(item: IItem) {
    if (item.amount == item.maxAmount) {
      this.snackBar.open("Max allowed: " + item.maxAmount, "Close", {
        duration: 2500
      });
      return;
    }

    item.amount += 1;
    this.selectedItemsError = undefined;

    const result = this.selectedItems.find(value => (value == item));
    // new item
    if (!result) {
      this.selectedItems.push(item);
    }
  }

  protected decrease(item: IItem) {
    item.amount -= 1;
    this.selectedItemsError = undefined;

    if (item.amount == 0) {
      const result = this.selectedItems.findIndex(value => (value == item));
      if (result != -1) {
        this.selectedItems.splice(result, 1);
      }
    }
  }

  protected proceed() {
    if (this.totalSelectedItems < this.minimumItemCount) {
      this.selectedItemsError = "Minimum of " + this.minimumItemCount + " items required";
    }

    if (this.selectedDeliveryDays.size == 0) {
      this.selectedDeliveryDaysError = "Please select delivery days";
    }

    if (this.selectedItemsError || this.selectedDeliveryDaysError) {
      this.snackBar.open("Please fix errors before proceeding.", "Close", {
        duration: 2500
      });
      return;
    }

    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = {
      items: this.selectedItems,
      days: this.selectedDeliveryDays
    };

    const dialogRef = this.dialog.open(CheckoutDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
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
export class SubscribeItemDialog {

  protected displayImage?: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) protected data: IItem,
    private dialogRef: MatDialogRef<CartItemsDialog>) { }

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
  imports: [FormsModule, FontAwesomeModule, RouterModule, KeyValuePipe, DecimalPipe, DatePipe, MatDialogModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
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
            <p [class]="deliverySettings.payment ? 'font-bold' : ''">{{ deliverySettings.payment ? deliverySettings.payment : 'Select Payment method' }}</p>
            @if (deliverySettings.payment) {
            <p class="text-sm">Visa **** **** **** 9609</p>
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
        @for (item of data.items; track item) {
        <div class="flex justify-between items-center">
          <b>{{ item.name }} {{ getAmount(item) > 1 ? ('(' + getAmount(item) + ')') : '' }}</b>
          <p>{{ '$' }}{{ getPrice(item)  | number: '1.2-2' }}</p>
        </div>
        }
        
        <div class="divider px-2"></div>

        <div class="flex justify-between items-center">
          <b>SubTotal:</b>
          <div class="flex flex-col items-end justify-end">
            <div class="flex gap-1 items-center">
              <p>{{ '$' }}{{ getSubTotal() | number: '1.2-2' }}</p>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center pt-1">
          <p class="text-xs">Taxes:</p>
          <p>{{ '$' }}{{ getTaxes() | number: '1.2-2' }}</p>
        </div>
        <div class="flex justify-between items-center">
          <p class="text-xs">Service Fee:</p>
          <p>{{ '$' }}{{ getServiceFee() | number: '1.2-2' }}</p>
        </div>
        <div class="flex justify-between items-center">
          <p class="text-xs">Delivery Fee:</p>
          <p class="text-success">Free</p>
        </div>

        <div class="divider px-2"></div>

        <div class="flex justify-between gap-4">
          <b>Total:</b>
          <b>{{ '$' }}{{ getTotal() | number: '1.2-2' }}</b>
        </div>
      </div>
      <p><b>Payment:</b> The Total amount shown will be deducted on each delivery day. You will be notified via email/message.</p>
      <p><b>Cancelation:</b> You can cancel this subscription whenever you like (no fee). All your Subscriptions are visible in "Subscriptions" category in Homepage side drawer (<fa-icon icon="bars"></fa-icon>).</p>
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

  constructor(
    @Inject(MAT_DIALOG_DATA) protected data: { items: IItem[], days: DaysOfWeekSetting },
    private dialogRef: MatDialogRef<CartItemsDialog>,
    private deliveryService: DeliveryService,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef) {
  }

  protected getAmount = Item.getAmount;
  protected getPrice = Item.getPrice;

  protected getSubTotal(): number {
    let subtotal: number = 0;
    for (let item of this.data.items) {
      subtotal += this.getPrice(item);
    }
    return subtotal;
  }

  protected getTaxes(): number {
    const subtotal = this.getSubTotal();
    const GST = subtotal * (OrderTotal.GST_Rate / 100);
    const PST = subtotal * (OrderTotal.PST_Rate / 100);
    return GST + PST;
  }

  protected getServiceFee(): number {
    return 2.0 * this.data.days.size;
  }

  protected getTotal(): number {
    return this.getSubTotal() + this.getServiceFee() + this.getTaxes();
  }

  protected ngOnInit() {
    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;
      this.cdr.detectChanges();
    });
  }

  protected openPaymentMethodDialog() {
    this.deliverySettings.payment = "TIGHT";
    this.deliveryService.setDeliverySetting(this.deliverySettings);
  }

  protected checkout() {
    if (!this.deliverySettings.payment) {
      this.snackBar.open("No payment method found.", "Close", {
        duration: 2500
      });
      return;
    }

    this.snackBar.open("Subscription added successfully.", "Close", {
      duration: 2500
    });

    this.router.navigate(['/']);

    this.closeDialog();
  }

  protected closeDialog() {
    this.dialogRef.close();
  }
}