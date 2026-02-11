import { ChangeDetectorRef, Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { Pipe, PipeTransform, Injectable } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ITime, ITimeSlot, TimeslotsDialog } from './timeslots';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { AddressBookAction, AddressDialog, IAddress, Province } from './addressDialog';
import { Category, ICategory } from './category';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DriverTip } from '../checkout/checkout';
import { IPayMethod } from '../user/user';

export const enum DeliveryMode {
  Delivery,
  Pickup
};

export enum DeliveryType {
  MeetAtDoor = 'Meet At Door',
  LeaveAtDoor = 'Leave At Door',
  LeaveAtLobby = 'Leave At Lobby (Hotel)'
};

export interface IDeliverySettings {
  mode: DeliveryMode,
  deliveryType: DeliveryType,
  category: ICategory,
  address?: IAddress,
  time?: ITime,
  payment?: IPayMethod,
  timeslot?: ITimeSlot,
  focusedCategory?: ICategory,
  tip?: DriverTip,
  tipAmount?: number,
  deliveryInstructions?: string
};


@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit: number = 100, ellipsis: string = '...'): string {
    if (value.length <= limit) {
      return value;
    }
    return value.substring(0, limit) + ellipsis;
  }
}


@Injectable({
  providedIn: 'root' // Makes the service a singleton and available throughout the app
})
export class DeliveryService {

  private _deliverySettings = new BehaviorSubject<IDeliverySettings>(AddressBook.DefaultSettings);
  public deliverySettings$ = this._deliverySettings.asObservable();

  private _addressBook = new BehaviorSubject<IAddress[]>([]);
  public addressBook$ = this._addressBook.asObservable();

  private _timeSlots = new BehaviorSubject<ITimeSlot[]>([]);
  public timeSlots$ = this._timeSlots.asObservable();

  constructor() {
    const defaultMode = this._deliverySettings.value.mode;
    // Update timeslots
    this.setTimeslots(defaultMode);
    // Update address book
    this.setAddressBook(defaultMode);

    // check if can get current time
    if (false) {
      let value = this._deliverySettings.value;
      value.timeslot = AddressBook.TimeNow;
      this.setDeliverySetting(value);
    }
  }

  public setDeliverySetting(settings: IDeliverySettings) {
    // commit change
    this._deliverySettings.next(settings);
  }

  public setTimeslots(mode: DeliveryMode) {
    let slots: ITimeSlot[] = [];

    // Delivery
    if (mode == DeliveryMode.Delivery) {
      slots = [
        { label: "Today", time: 0 },
        { label: "Tomorrow", time: 0, slots: [{ start: 10, end: 12 }, { start: 10, end: 12 }, { start: 10, end: 12 }, { start: 10, end: 12 }, { start: 10, end: 12 }, { start: 10, end: 12 }] },
        { label: "Day After", time: 200, slots: [{ start: 10, end: 12 }, { start: 10, end: 12 }, { start: 10, end: 12 }] }
      ];
    }
    // Pickup
    else if (mode == DeliveryMode.Pickup) {
      slots = [
        { label: "Today", time: 0 },
        { label: "Tomorrow", time: 0, slots: [{ start: 10, end: 12 }, { start: 10, end: 12 }, { start: 10, end: 12 }] },
        { label: "Wednessday", time: 500 }
      ];
    }

    // commit change
    this._timeSlots.next(slots);
  }

  public setAddressBook(mode: DeliveryMode) {
    let book: IAddress[] = [];

    // Delivery
    if (mode == DeliveryMode.Delivery) {
      book = [
        { label: "Home", addressLine: "123 Manitoba ave.", city: "Winnipeg", province: Province.MB, postal: "R1W 2G3" }
      ];
    }
    // Pickup
    else if (mode == DeliveryMode.Pickup) {
      book = [
        { label: "BakeSale", addressLine: "Area 51", city: "Winnipeg", province: Province.MB, postal: "R1W 2G3" }
      ];
    }

    // commit change
    this._addressBook.next(book);
  }

  public addAddress(address: IAddress) {
    address.map = {};

    let book = this._addressBook.value;
    address.label = address.label.trim();
    book.push(address);
    this._addressBook.next(book);
  }

  public editAddress(label: string, address: IAddress) {
    let book = this._addressBook.value;

    const index = book.findIndex(addy => (addy.label == label));
    if (index != -1) {
      address.map = {};

      book[index] = address;
      this._addressBook.next(book);
    }
  }

  public deleteAddress(label: string) {
    let book = this._addressBook.value;
    let deliverySettings = this._deliverySettings.value;

    const index = book.findIndex(addy => (addy.label == label));
    if (index != -1) {
      // Reset delivery settings address if current selection
      if (deliverySettings.address == book[index]) {
        deliverySettings.address = undefined;
        this.setDeliverySetting(deliverySettings);
      }

      book.splice(index, 1);
      this._addressBook.next(book);
    }
  }
}


@Component({
  selector: 'delivery-switch',
  imports: [FormsModule, FontAwesomeModule],
  template: `
<div class="tabs tabs-sm tabs-box w-fit">
  @for (entry of deliveryModes; track entry[0]) {
  <input type="radio" class="tab" [name]="name" [checked]="selectedDeliveryMode == entry[0]"
    [ariaLabel]="entry[1].label" [value]="entry[0]" [(ngModel)]="selectedDeliveryMode"
    (change)="onDeliveryModeChange()" />
  }
</div>
`
})
export class DeliverySwitch {

  static deleiverySwitchCount: number = 0;

  @Input()
  protected switchName?: string;

  protected get name(): string {
    if (!this.switchName) {
      this.switchName = "DeliverySwitch#" + DeliverySwitch.deleiverySwitchCount++;
    }
    return this.switchName;
  }

  protected selectedDeliveryMode: DeliveryMode = DeliveryMode.Delivery;
  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;

  protected get deliveryModes() {
    return Array.from(AddressBook.DeliveryModes.entries());
  }

  constructor(
    private deliveryService: DeliveryService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;
      this.selectedDeliveryMode = this.deliverySettings.mode;
      this.cdr.detectChanges();
    });
  }

  protected onDeliveryModeChange() {
    if (this.deliverySettings.mode != this.selectedDeliveryMode) {
      this.deliverySettings.mode = this.selectedDeliveryMode;
      this.deliveryService.setDeliverySetting(this.deliverySettings);

      this.deliveryService.setAddressBook(this.selectedDeliveryMode);
      this.deliveryService.setTimeslots(this.selectedDeliveryMode);

      const message = "Changed to " + AddressBook.DeliveryModes.get(this.selectedDeliveryMode)?.label + ".";
      this.snackBar.open(message, "Close", {
        duration: 2500
      });
    }
  }
};


@Component({
  selector: 'address-book',
  imports: [FormsModule, FontAwesomeModule, TruncatePipe],
  templateUrl: './addressBook.html'
})
export class AddressBook {

  static readonly DeliveryModes: Map<DeliveryMode, { label: string, icon: string }> = new Map([
    [DeliveryMode.Delivery, {
      label: "Delivery",
      icon: "home"
    }],
    [DeliveryMode.Pickup, {
      label: "Pickup",
      icon: "car"
    }]
  ]);

  static readonly TimeNow: ITimeSlot = {
    label: "Now",
    time: 0
  };

  static readonly CurrentLocation: IAddress = {
    label: "Current Location",
    addressLine: "Current Location"
  };

  static readonly DefaultSettings: IDeliverySettings = {
    mode: DeliveryMode.Delivery,
    deliveryType: DeliveryType.MeetAtDoor,
    category: Category.DefaultCategory
  };

  @Input()
  public timeslot: boolean = false;

  @Output()
  public change = new EventEmitter<void>();

  @Output()
  public clickFavourite = new EventEmitter<void>();

  protected readonly addressBookAction = AddressBookAction;
  protected readonly currentLocation = AddressBook.CurrentLocation;

  protected settings: IDeliverySettings = AddressBook.DefaultSettings;
  protected addressBook: IAddress[] = [];
  protected timeSlots: ITimeSlot[] = [];

  protected selectedAddress: IAddress | undefined = undefined;

  // TRUE if user is in selecting mode; for picking a favourite address
  protected isSelecting: boolean = false;
  protected selectingForLabel?: string;

  protected get deliveryModes() {
    return Array.from(AddressBook.DeliveryModes.entries());
  }

  protected get deliveryMode() {
    return AddressBook.DeliveryModes.get(this.settings.mode);
  }

  protected get isDelivery() {
    return (this.settings.mode == DeliveryMode.Delivery);
  }

  protected get homeAddressExist() {
    const ret = this.addressBook.filter(value => (value.isFavourite && value.label.toLowerCase() == "home"));
    return ret.length != 0;
  }

  protected get workAddressExist() {
    const ret = this.addressBook.filter(value => (value.isFavourite && value.label.toLowerCase() == "work"));
    return ret.length != 0;
  }

  protected get hasFavouritesToAdd() {
    for (let addy of this.addressBook) {
      if (this.selectingForLabel != undefined || !addy.isFavourite) {
        return true;
      }
    }
    return false;
  }

  constructor(
    private deliveryService: DeliveryService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.deliveryService.deliverySettings$.subscribe(data => {
      this.settings = data;

      // update address selection
      this.selectedAddress = undefined;
      if (this.settings.address) {
        this.selectedAddress = this.addressBook.find(addy => (addy.label == this.settings.address?.label));
      }

      this.cdr.detectChanges();
    });

    this.deliveryService.addressBook$.subscribe(data => {
      this.addressBook = data;

      if (this.settings.address) {
        this.selectedAddress = data.find(addy => (addy.label == this.settings.address!.label));
        // update deliverySettings.address
        if (this.selectedAddress) {
          this.onAddressChange(this.selectedAddress);
        }
      }

      if (data && data.length > 0 && !this.selectedAddress) {
        this.selectedAddress = data[0];
        // update deliverySettings.address
        this.onAddressChange(this.selectedAddress);
      }

      this.cdr.detectChanges();
    });

    this.deliveryService.timeSlots$.subscribe(data => {
      this.timeSlots = data;
      this.cdr.detectChanges();
    });
  }

  protected onAddressChange(address: IAddress, favourite?: boolean) {
    this.settings.address = address;
    this.deliveryService.setDeliverySetting(this.settings);

    this.change.emit();

    if (favourite) {
      this.clickFavourite.emit();
    }
  }

  protected openTimeslotsDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.width = '90%';

    const dialogRef = this.dialog.open(TimeslotsDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected openAddressBookDialog(address?: IAddress) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = address;
    dialogConfig.width = '90%';

    const dialogRef = this.dialog.open(AddressDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected setSelectLabel(label?: string) {
    this.selectingForLabel = label;
    this.isSelecting = true;
  }

  protected closeSelectLabel() {
    this.isSelecting = false;
  }

  protected selectLabelAddress(address: IAddress) {
    address.isFavourite = true;
    if (this.selectingForLabel != undefined) {
      address.label = this.selectingForLabel;
    }

    this.isSelecting = false;
  }
};


@Component({
  imports: [FormsModule, FontAwesomeModule, AddressBook, MatDialogClose],
  template: `
<div class="bg-base-200 p-4">
  <address-book [timeslot]="showTimeslots" (clickFavourite)="onClickFavourite()" />
  <br />

  <div mat-dialog-actions>
    <button mat-dialog-close class="btn btn-soft w-full">
        Close
    </button>
  </div>
</div>
`
})
export class AddressBookDialog {
  protected showTimeslots: boolean = true;

  constructor(
    private dialogRef: MatDialogRef<AddressBookDialog>,
    @Inject(MAT_DIALOG_DATA) private data: { timeslot: boolean }) {
    if (data) {
      this.showTimeslots = data.timeslot;
    }
  }

  protected onClickFavourite() {
    this.dialogRef.close();
  }
};
