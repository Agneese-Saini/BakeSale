import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { Pipe, PipeTransform, Injectable } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ITime, ITimeSlot, TimeslotsDialog } from './timeslots';
import { MatDialog, MatDialogConfig, MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { AddressBookAction, AddressDialog, IAddress } from './addressDialog';
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
        { label: "Test", addressLine: "123 Manitoba ave." },
        { label: "Test 2", addressLine: "999 Ottawa ave." }
      ];
    }
    // Pickup
    else if (mode == DeliveryMode.Pickup) {
      book = [
        { label: "Test", addressLine: "123 Manitoba ave." }
      ];
    }

    // commit change
    this._addressBook.next(book);
  }

  public addAddress(address: IAddress) {
    address.map = {};

    let book = this._addressBook.value;
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

    const index = book.findIndex(addy => (addy.label == label));
    if (index != -1) {
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
  
  get deliveryModes() {
    return Array.from(AddressBook.DeliveryModes.entries());
  }

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

  protected settings: IDeliverySettings = AddressBook.DefaultSettings;
  protected addressBook: IAddress[] = [];
  protected timeSlots: ITimeSlot[] = [];

  protected selectedAddress: IAddress | undefined = undefined;

  protected addressBookAction = AddressBookAction;
  protected currentLocation = AddressBook.CurrentLocation;

  protected get deliveryMode() {
    return AddressBook.DeliveryModes.get(this.settings.mode);
  }

  protected get isDelivery() {
    return (this.settings.mode == DeliveryMode.Delivery);
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
        this.onAddressChange();
      }

      if (data && data.length > 0 && !this.selectedAddress) {
        this.selectedAddress = data[0];
        // update deliverySettings.address
        this.onAddressChange();
      }
      
      this.cdr.detectChanges();
    });

    this.deliveryService.timeSlots$.subscribe(data => {
      this.timeSlots = data;
      this.cdr.detectChanges();
    });
  }

  protected onAddressChange() {
    this.settings.address = this.selectedAddress;
    this.deliveryService.setDeliverySetting(this.settings);
  }

  protected openTimeslotsDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";

    const dialogRef = this.dialog.open(TimeslotsDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected openAddressBookDialog(address?: IAddress) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = address;

    const dialogRef = this.dialog.open(AddressDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }
};


@Component({
  imports: [FormsModule, FontAwesomeModule, AddressBook, MatDialogContent, MatDialogActions],
  template: `
<div class="bg-base-200">
  <div mat-dialog-content>
    <address-book [timeslot]="true" />
  </div>

  <div mat-dialog-actions>
    <div class="grid w-full">
      <button class="btn bg-base-100" (click)="onClose()">
        Done
      </button>
    </div>
  </div>
</div>
`
})
export class AddressBookDialog {

  constructor(
    private dialogRef: MatDialogRef<AddressDialog>) { }

  protected onClose() {
    this.dialogRef.close();
  }
};
