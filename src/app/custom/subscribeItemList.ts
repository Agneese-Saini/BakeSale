import { Component, Input, Output, ChangeDetectorRef, EventEmitter, Inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatDialogModule, MatDialog, MatDialogConfig, MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IItem, Item } from "../content/item";
import { PriceTag, TextReadMore } from "../content/itemDialog";
import { ICategory } from "../header/category";
import { Subscribe } from "./subscribe";

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
    <input tabindex="-1" type="search" class="grow placeholder-gray-500 input-lg" placeholder="Search" />
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
      @for (item of category.items; track $index) {
      <tr>
        <td class="flex justify-between items-center">
          <div class="flex gap-2 items-center lg:items-start">
            <div class="indicator">
              <div class="w-24 lg:w-32">
                <img class="rounded-box link w-full h-24 lg:h-32" [src]="getImage(item)" (click)="openItemDialog(item)" />

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
              @if (item.tags) {
              <div class="flex flex-wrap gap-1">
                @for (tag of item.tags; track $index) {
                <span class="badge badge-soft badge-xs font-semibold px-2">{{ tag }}</span>
                }
              </div>
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
        @for (img of data.image; track $index) {
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