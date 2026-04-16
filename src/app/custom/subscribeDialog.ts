import { KeyValuePipe, DatePipe } from "@angular/common";
import { Component, Inject, ChangeDetectorRef, forwardRef } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { provideNativeDateAdapter } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatDialogModule, MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatDialogConfig } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router, RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Receipt } from "../checkout/receipt";
import { IItem } from "../content/item";
import { IDeliverySettings, AddressBook, DeliveryService, AddressBookDialog, DeliveryMode } from "../header/addressBook";
import { IAddress, AddressDialog } from "../header/addressDialog";
import { UserService } from "../user/user";
import { ISubscription } from "./subscribe";
import { SubscribeItemList } from "./subscribeItemList";
import { PaymentMethodDialog } from "../checkout/checkout";


@Component({
  providers: [provideNativeDateAdapter()],
  imports: [FormsModule, FontAwesomeModule, RouterModule, KeyValuePipe, DatePipe, MatDialogModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, forwardRef(() => Receipt)],
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
          @for (day of data.days | keyvalue; track $index) {
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
            <p class="text-sm">{{ deliverySettings.payment.type }} **** **** **** {{ deliverySettings.payment.cardNumber ? getLastFourDigits(deliverySettings.payment.cardNumber) : deliverySettings.payment.name }}</p>
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
export class SubscribeDialog {

  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;
  protected addressBook: IAddress[] = [];

  protected selectedDate: Date = new Date();
  protected prevMode: any;

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
    private dialogRef: MatDialogRef<SubscribeDialog>,
    private deliveryService: DeliveryService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private router: Router,
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

    this.prevMode = this.deliverySettings.mode;
    this.deliverySettings.mode = DeliveryMode.Delivery;
    this.deliveryService.setDeliverySetting(this.deliverySettings);
    this.deliveryService.loadAddressBook(DeliveryMode.Delivery);

    this.dialogRef.afterClosed().subscribe(() => {
      // Restore previous delivery mode and address book
      if (this.deliverySettings.mode != this.prevMode) {
        this.deliverySettings.mode = this.prevMode;
        this.deliveryService.setDeliverySetting(this.deliverySettings);
        this.deliveryService.loadAddressBook(this.prevMode);
      }
    });
  }

  protected getLastFourDigits(cardNumber: string): string {
    return cardNumber.slice(-4);
  }

  protected openAddressBookDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.width = '90%';

    let dialogRef: any;
    if (this.addressBook.length > 0) {
      dialogConfig.data = { timeslot: false };
      dialogRef = this.dialog.open(AddressBookDialog, dialogConfig);
    }
    else {
      dialogConfig.data = undefined;
      dialogRef = this.dialog.open(AddressDialog, dialogConfig);
    }

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