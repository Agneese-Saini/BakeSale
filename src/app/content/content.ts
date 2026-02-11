import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { AddressBook, DeliveryService, IDeliverySettings } from '../header/addressBook';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule, FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faYoutube, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { Category, CategoryService, ICategory } from '../header/category';
import { ItemList } from './itemList';
import { Logo, Header } from "../header/header";
import { ISocialPost, MediaType } from "./socialPost";
import { IUser, UserRole, UserService } from '../user/user';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatBottomSheet, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { CartItemsDialog } from '../checkout/cartItemDialog';


@Component({
  selector: 'app-content',
  imports: [FormsModule, FontAwesomeModule, ItemList, Logo, Header, MatBottomSheetModule],
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

  readonly socials: ISocialPost[] = [
    {
      user: { name: 'de Partie', userRole: UserRole.Chef },
      media: [
        { type: MediaType.Photo, src: "https://m.media-amazon.com/images/I/81KnMda0d4L._US500_.jpg" }
      ]
    },
    {
      user: { name: 'Taylor', userRole: UserRole.Customer },
      media: [
        { type: MediaType.Photo, src: "https://theovenchef.com/wp-content/uploads/2023/08/WhatsApp-Image-2023-11-01-at-5.39.28-PM-1-scaled-e1698841246352.jpeg" },
        { type: MediaType.Video, src: "https://i.pinimg.com/736x/04/ae/1a/04ae1a97b1cfa3b227ee73575fcdf706.jpg" }
      ]
    }
  ];

  protected get deliveryMode() {
    return AddressBook.DeliveryModes.get(this.deliverySettings.mode);
  }

  constructor(
    private userService: UserService,
    private deliveryService: DeliveryService,
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;
      this.cdr.detectChanges();
    });

    this.categoryService.categories$.subscribe(data => {
      this.categories = data;
      if (this.deliverySettings.category == Category.DefaultCategory) {
        this.onSelectCategory(data[0]);
      }
      this.cdr.detectChanges();
    });

    this.userService.user$.subscribe(data => {
      this.user = data;
      this.cdr.detectChanges();
    });

  }

  protected onSelectCategory(category: ICategory) {
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

  protected login() {
    this.userService.login('', '');
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
    dialogConfig.width = '90%';

    const dialogRef = this.dialog.open(JumpToDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected openBottomSheet() {
    this.bottomSheet.open(NotificationSheet);
  }
}


@Component({
  imports: [FormsModule, FontAwesomeModule, MatDialogModule],
  template: `
<div class="bg-base-300">
  <h1 mat-dialog-title class="text-4xl font-bold">Categories</h1>

  <div mat-dialog-content>
    <table class="table table-zebra">
      <tbody>
        @for (category of data.subcats; track category) {
        <tr class="h-12">
          <td>
            <button 
              [class]="'link label text-lg w-full ' + ((category.items || category.customizer) ? 'text-neutral' : '')" 
              style="text-decoration: none;"
              [disabled]="!category.customizer && !category.items"
              (click)="focusCategory(category)">
              {{ category.name }} {{ (!category.customizer && category.items) ? ('(' + category.items.length + ')') : (!category.customizer ? '(0)' : '') }}
            </button>
          </td>
        </tr>
        }
      </tbody>
    </table>
  </div>

  <div mat-dialog-actions>
    <button class="btn btn-neutral w-full" (click)="closeDialog()">Close</button>
  </div>
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


@Component({
  selector: 'notification-sheet',
  template: `
<ul class="list bg-base-100 rounded-box shadow-md min-h-64">
  <li class="p-4 pb-2 opacity-60 tracking-wide">
    Notifications
    <div class="divider m-0 p-0"></div>
  </li>

  <li class="list-row items-center">
    <div><img class="size-10 rounded-box" src="https://img.daisyui.com/images/profile/demo/1@94.webp"/></div>
    <div class="flex flex-col gap-2">
      <p><b>UserName</b> liked your post <b>My Post Tittle...</b></p>
      <p class="text-xs opacity-60">22 minutes ago</p>
    </div>
    <div class="dropdown dropdown-bottom dropdown-end">
      <div tabindex="-1" role="button" class="btn btn-ghost text-xl">
        <fa-icon icon="ellipsis"></fa-icon>
      </div>
      <ul tabindex="-1" class="dropdown-content menu bg-base-300 rounded-box z-50 w-44 p-2 shadow">
        <li><a>Option 1</a></li>
        <li><a>Option 2</a></li>
      </ul>
    </div>
  </li>

  <li class="list-row items-center">
    <div><img class="size-10 rounded-box" src="https://img.daisyui.com/images/profile/demo/1@94.webp"/></div>
    <div class="flex flex-col gap-2">
      <p><b>UserName</b> liked your post <b>My Post Tittle...</b></p>
      <p class="text-xs opacity-60">22 minutes ago</p>
    </div>
    <div class="dropdown dropdown-bottom dropdown-end">
      <div tabindex="-1" role="button" class="btn btn-ghost text-xl">
        <fa-icon icon="ellipsis"></fa-icon>
      </div>
      <ul tabindex="-1" class="dropdown-content menu bg-base-300 rounded-box z-50 w-44 p-2 shadow">
        <li><a>Option 1</a></li>
        <li><a>Option 2</a></li>
      </ul>
    </div>
  </li>
</ul>

`,
  imports: [FaIconComponent]
})
export class NotificationSheet {
  constructor(
    private sheetRef: MatBottomSheetRef<NotificationSheet>) { }

  protected close() {
    this.sheetRef.dismiss();
  }
}
