import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IUser, UserService } from './user';
import { IItem, Item } from '../content/item';
import { DatePipe, DecimalPipe, KeyValuePipe } from '@angular/common';
import { ISubscription, Subscribe, SubscribeItemList } from '../custom/subscribe';
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
  imports: [FormsModule, FontAwesomeModule, MatDialogModule, DecimalPipe],
  template: `
<div class="bg-base-200">
  <div mat-dialog-content>
    <h2 class="font-bold">Order Summary:</h2>
    <div class="bg-base-300 rounded-box p-4">
      @for (item of selectedItems; track item) {
      <div class="flex justify-between items-center">
        <b>{{ item.name }} {{ getAmount(item) > 1 ? ('(' + getAmount(item) + ')') : '' }}</b>
        <div class="flex gap-2 items-center">
          @if (item.price.previousPrice) {
          <p class="label text-xs line-through">{{ '$' }}{{ getPrice(item, item.price.previousPrice) | number: '1.1-2' }}
          </p>
          }
          <p>{{ '$' }}{{ getPrice(item) | number: '1.2-2' }}</p>
        </div>
      </div>
      }

      <div class="divider px-2"></div>

      <div class="flex justify-between items-center">
        <P>SubTotal:</P>
        <div class="flex flex-col items-end justify-end">
          <div class="flex gap-1 items-center">
            <p>{{ '$' }}{{ getSubTotal() | number: '1.2-2' }}</p>
          </div>
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
      @if (getSavings() != 0) {
      <p class="text-right text-success"> Saving: {{ '$' }}{{ getSavings() | number: '1.2-2' }}</p>
      }
      <p class="text-sm text-right text-gray-500">/per delivery</p>
    </div>
    <br />

    <div class="flex flex-col">
      <h2 class="font-bold">Payment Method:</h2>
      <div class="bg-base-300 rounded-box p-4">
        <p class="font-bold">{{ data.payment!.name }}</p>
        <p class="text-sm">Visa **** **** **** 9609</p>
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

  protected ngOnInit() {
  }

  protected closeDialog() {
    this.dialogRef.close();
  }
}


@Component({
  imports: [FormsModule, FontAwesomeModule, MatDialogModule, SubscribeItemList],
  template: `
<div class="bg-base-200">
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
      this.error = "Minimum of " + Subscribe.MinimumItemCount + " items required";

      this.snackBar.open(this.error, "Close", {
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
            <a class="link" style="text-decoration: none;">Change Delivery Frequency</a>
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

    const dialogRef = this.dialog.open(SubscriptionItemsDialog, dialogConfig);
    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected closeDialog() {
    this.dialogRef.close();
  }
}
