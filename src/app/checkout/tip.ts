import { DecimalPipe } from "@angular/common";
import { Component, ChangeDetectorRef } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatDialog, MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IDeliverySettings, AddressBook, DeliveryService } from "../header/addressBook";
import { Cart, CartService } from "./cart";
import { DriverTip } from "./checkout";

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
export class AddTip {

  protected readonly tips = Object.values(DriverTip).filter((value) => typeof value === 'number') as number[];

  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;
  protected shoppingCart: Cart = new Map();
  protected selectedTip: DriverTip = DriverTip.Tip_15;

  protected get subTotal(): number {
    return CartService.subTotal(this.shoppingCart);
  }

  protected get tipAmount(): number {
    return AddTip.getAmount(this.subTotal, this.selectedTip, this.deliverySettings.tipAmount);
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
    dialogConfig.width = '90%';

    const dialogRef = this.dialog.open(TipAmountDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  static getAmount(subTotal: number, tip?: DriverTip, amount?: number): number {
    if (tip == DriverTip.Tip_Custom) {
      return amount ? amount : 0;
    }

    if (tip) {
      const percentage = Number(tip);
      return subTotal * percentage / 100;
    }

    return 0.0;
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