import { Component, Inject, ChangeDetectorRef, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatDialogConfig, MatDialogModule } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IItem } from "../content/item";
import { ItemDialog } from "../content/itemDialog";
import { Cart, CartService } from "./cart";
import { CartItemList } from "./cartItemList";



@Component({
  imports: [FormsModule, FontAwesomeModule, CartItemList, MatDialogModule],
  template: `
<div class="bg-base-200">
  <div mat-dialog-content>
    <h1>Your shopping cart ({{ data.name }}):</h1>

    <div class="bg-base-100 rounded-box h-94 overflow-y-auto p-2">
      <cart-item-list [items]="items" />    
    </div>
  </div>
  <br />

  <div mat-dialog-actions>    
    <button class="btn btn-neutral w-full" (click)="closeDialog()">Close</button>
  </div>
</div>
`
})
export class CartItemsDialog {

  protected shoppingCart: Cart = new Map();

  protected get items(): IItem[] | undefined {
    return this.shoppingCart.get(this.data.name);
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) protected data: IItem,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<CartItemsDialog>,
    private snackBar: MatSnackBar,
    private cartService: CartService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.cartService.shoppingCart$.subscribe(data => {
      this.shoppingCart = data;
      this.cdr.detectChanges();
    });
  }

  protected openItemDialog(item: IItem) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = item;
    dialogConfig.width = '90%';

    const dialogRef = this.dialog.open(ItemDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected removeItem(item: IItem) {
    this.cartService.removeFromCart(item);

    const message = item.name + ": was removed from your cart.";
    const snackBarRef = this.snackBar.open(message, "Undo", {
      duration: 2500
    });

    snackBarRef.onAction().subscribe(() => {
      this.cartService.addToCart(item);
      this.cdr.detectChanges();
    });
  }

  protected closeDialog() {
    this.dialogRef.close();
  }
};