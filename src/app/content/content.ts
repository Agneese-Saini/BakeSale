import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { AddressBook, DeliveryService, IDeliverySettings } from '../header/delivery';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { faYoutube, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { Category, CategoryService, ICategory } from '../header/category';
import { ItemList } from './itemList';
import { Logo, Header } from "../header/header";
import { SocialPost } from "./socialPost";
import { IUser, UserRole, UserService, UserCard } from '../user/user';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { CartItemsDialog } from '../checkout/cartItemDialog';

@Component({
  selector: 'app-content',
  imports: [FormsModule, FontAwesomeModule, ItemList, Logo, Header, SocialPost, UserCard],
  templateUrl: './content.html',
  styleUrl: './content.css'
})
export class Content {

  readonly faYoutube = faYoutube;
  readonly faInstagram = faInstagram;
  readonly userRole = UserRole;

  protected isActive = Category.isActive;

  protected categories: ICategory[] = [];
  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;
  protected user: IUser = UserService.DefaultUser;

  protected get canShowHomepage() {
    return this.user.userRole == UserRole.Guest && (this.deliverySettings.showHomepage == undefined || this.deliverySettings.showHomepage == true);
  }

  protected get deliveryMode() {
    return AddressBook.DeliveryModes.get(this.deliverySettings.mode);
  }

  constructor(
    private userService: UserService,
    private deliveryService: DeliveryService,
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;
      this.cdr.detectChanges();
    });

    this.categoryService.categories$.subscribe(data => {
      this.categories = data;
      this.cdr.detectChanges();
    });

    this.userService.user$.subscribe(data => {
      this.user = data;
      this.cdr.detectChanges();
    });

    this.onSelectCategory(this.deliverySettings.category);
  }

  protected showHomepage(enable: boolean) {
    this.deliverySettings.showHomepage = enable;
    this.deliveryService.setDeliverySetting(this.deliverySettings);
  }

  protected login() {
    this.userService.login('', '');
    this.showHomepage(false);
  }

  protected onSelectCategory(category?: ICategory) {
    this.deliverySettings.category = category;

    if (category && category.subcats) {
      const first = category.subcats[0];
      if (first) {
        this.deliverySettings.focusedCategory = (first.subcats && first.subcats.length > 0) ? first.subcats[0] : first;
      } else {
        this.deliverySettings.focusedCategory = undefined;
      }
    }

    this.deliveryService.setDeliverySetting(this.deliverySettings);
  }

  protected isFocused(category: ICategory): boolean {
    if (category == this.deliverySettings.focusedCategory) {
      return true;
    }

    if (category.subcats) {
      for (let sub of category.subcats) {
        if (this.isFocused(sub)) {
          return true;
        }
      }
    }

    return false;
  }

  protected focusCategory(category: ICategory) {
    this.deliverySettings.focusedCategory = category;
    this.deliveryService.setDeliverySetting(this.deliverySettings);
  }

  protected openDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = this.deliverySettings.category;

    const dialogRef = this.dialog.open(JumpToDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }
}


@Component({
  imports: [FormsModule, FontAwesomeModule],
  template: `
<div class="bg-base-300 min-w-84 p-4">
  <h2 mat-dialog-title class="text-4xl font-bold">{{ data.name }}</h2>

  <div class="flex overflow-x-auto">
    <table class="table table-zebra">
      <tbody>
        @for (category of data.subcats; track category) {
        <tr class="h-12">
          <td>
            <button 
              [class]="'link text-lg w-full ' + (category.items ? '' : 'text-gray-500')" 
              style="text-decoration: none;"
              (click)="focusCategory(category)">
              {{ category.name }} ({{ category.items ? category.items.length : 0 }})
            </button>
          </td>
        </tr>
        }
      </tbody>
    </table>
  </div>

  <button class="btn btn-neutral mt-4 w-full" (click)="closeDialog()">Close</button>
</div>
`
})
export class JumpToDialog {

  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;

  constructor(
    @Inject(MAT_DIALOG_DATA) protected data: ICategory,
    private dialogRef: MatDialogRef<CartItemsDialog>,
    private deliveryService: DeliveryService,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;
      this.cdr.detectChanges();
    });
  }

  protected closeDialog() {
    this.dialogRef.close();
  }

  protected focusCategory(category: ICategory) {
    this.deliverySettings.focusedCategory = category;
    this.deliveryService.setDeliverySetting(this.deliverySettings);
    this.closeDialog();
  }
}
