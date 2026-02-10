import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IUser, UserService } from './user';
import { IItem, Item } from '../content/item';
import { DatePipe, DecimalPipe, KeyValuePipe } from '@angular/common';
import { ISubscription, Subscribe, SubscribeItemList, SubscribeOrderSummary } from '../custom/subscribe';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CartItemsDialog } from '../checkout/cartItemDialog';
import { ICategory } from '../header/category';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'subscriptions',
  imports: [FormsModule, FontAwesomeModule, RouterModule, KeyValuePipe, DecimalPipe, DatePipe],
  templateUrl: "subscriptions.html"
})
export class Subscriptions {

  protected currentFilter?: string;  
  protected user: IUser = UserService.DefaultUser;

  protected getAmount = Item.getAmount;
  protected getTotalItems = Subscribe.getTotalItems;
  protected getTotal = Subscribe.getTotal;
  protected getSelectedItems = SubscribeItemList.getSelectedItems;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.userService.user$.subscribe(data => {
      this.user = data;
      this.cdr.detectChanges();
    });
  }
  
  protected openOrderSummaryDialog(sub: ISubscription) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = sub;
    dialogConfig.width = '90%';

    const dialogRef = this.dialog.open(OrderSummaryDialog, dialogConfig);
    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected openChangeSubscriptionDialogDialog(sub: ISubscription) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = sub;

    const dialogRef = this.dialog.open(ChangeSubscriptionDialog, dialogConfig);
    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected getLastItem(sub: ISubscription) {
    return this.getSelectedItems(sub.category).at(-1);
  }

  protected getLastDay(sub: ISubscription) {
    return [...sub.days.keys()].at(-1);
  }
};


@Component({
  imports: [FormsModule, FontAwesomeModule, MatDialogModule, SubscribeOrderSummary],
  template: `
<div class="bg-base-200">
  <div mat-dialog-content>
    <h2 class="font-bold">Order Summary:</h2>
    <div class="bg-base-300 rounded-box p-4">
      <subscribe-order-summary [subscription]="data"></subscribe-order-summary>
    </div>
    <br />

    <div class="flex flex-col">
      <h2 class="font-bold">Payment Method:</h2>
      <div class="bg-base-300 rounded-box p-4">
        <div class="flex gap-2 items-center">
          <fa-icon icon="credit-card"></fa-icon>
          <div class="flex flex-col">
            <p class="font-bold">{{ data.payment!.name }}</p>
            <p class="text-sm">Visa **** **** **** {{ getLastFourDigits(data.payment!.cardNumber) }}</p>
          </div>
        </div>
      </div>
    </div>
  <br /> 
    <p>
      <b>Payment:</b> The Total amount shown will be deducted on each delivery day. You will be notified via email/message.
    </p>
  <br /> 
    <p>
      <b>Cancelation:</b> You can cancel this subscription whenever you like. 
      The order payment will be deducted if the cancelation is done the day before or the day of delivery.       
    </p>
  </div>
  <br /> 

  <div mat-dialog-actions>
    <button class="btn btn-neutral w-full" (click)="closeDialog()">Close</button>
  </div>
</div>
`
})
export class OrderSummaryDialog {

  protected getAmount = Item.getAmount;
  protected getPrice = Item.getPrice;

  constructor(
    @Inject(MAT_DIALOG_DATA) protected data: ISubscription,
    private dialogRef: MatDialogRef<CartItemsDialog>) { }

  protected ngOnInit() {
  }

  protected get selectedItems(): IItem[] {
    return SubscribeItemList.getSelectedItems(this.data.category);
  }

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

  protected closeDialog() {
    this.dialogRef.close();
  }
}


@Component({
  imports: [FormsModule, FontAwesomeModule, MatDialogModule, SubscribeItemList],
  template: `
<div class="bg-base-100">
  <subscribe-item-list mat-dialog-content [category]="category" [error]="error" (change)="error=undefined;"></subscribe-item-list>

  <div mat-dialog-actions class="grid gap-2">
    <button class="btn btn-warning w-full" (click)="save()">Save Changes</button>
    <button class="btn btn-soft w-full" (click)="closeDialog()">Cancel</button>
  </div>
</div>
`
})
export class SubscriptionItemsDialog {

  protected category: ICategory;
  protected error?: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: ISubscription,
    private dialogRef: MatDialogRef<CartItemsDialog>,
    private snackBar: MatSnackBar) {
    this.category = structuredClone(data.category);
  }

  protected save() {
    const selectedItems = SubscribeItemList.getSelectedItems(this.category);
    if (Subscribe.getTotalItems(selectedItems) < Subscribe.MinimumItemCount) {
      this.error = "Minimum Required " + Subscribe.MinimumItemCount;

      const message = "Minimum of " + Subscribe.MinimumItemCount + " items required";
      this.snackBar.open(message, "Close", {
        duration: 2500
      });
      return;
    }

    this.data.category = this.category;
    this.snackBar.open("Changes Saved. Your total amount has been updated.", "Close", {
      duration: 2500
    });

    this.dialogRef.close();
  }

  protected closeDialog() {
    this.dialogRef.close();
  }
}


@Component({
  imports: [FormsModule, FontAwesomeModule, MatDialogModule],
  template: `
<div class="bg-base-200">
  <div mat-dialog-actions>
    <table class="table">
      <tbody>
        <tr>
          <td class="flex justify-center w-full">
            <a class="link" style="text-decoration: none;" (click)="openSubscriptionItemsDialog()">Add/Remove Items</a>
          </td>
        </tr>
        <tr>
          <td class="flex justify-center w-full">
            <a class="link" style="text-decoration: none;">Change Delivery Days</a>
          </td>
        </tr>
        <tr>
          <td class="flex justify-center w-full">
            <a class="link" style="text-decoration: none;">Change Delivery Address</a>
          </td>
        </tr>
        <tr>
          <td class="flex justify-center w-full">
            <a class="link" style="text-decoration: none;">Change Payment Method</a>
          </td>
        </tr>
        <tr>
          <td class="flex justify-center w-full">
            <a class="link text-error" style="text-decoration: none;">Cancel Subscription</a>
          </td>
        </tr>
        <tr>
          <td class="flex justify-center w-full">
            <a class="link" style="text-decoration: none;" (click)="closeDialog()">Close</a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
`
})
export class ChangeSubscriptionDialog {

  constructor(
    @Inject(MAT_DIALOG_DATA) protected data: ISubscription,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<CartItemsDialog>,
    private cdr: ChangeDetectorRef) { }

  protected openSubscriptionItemsDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = this.data;
    dialogConfig.width = '90%';

    const dialogRef = this.dialog.open(SubscriptionItemsDialog, dialogConfig);
    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected closeDialog() {
    this.dialogRef.close();
  }
}
