import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Inject, Input, NgZone, Output, ViewChild } from '@angular/core';
import { Pipe, PipeTransform, Injectable } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ITime, ITimeSlot, TimeslotsDialog } from './timeslots';
import { MatDialog, MatDialogConfig, MatDialogRef, MAT_DIALOG_DATA, MatDialogClose, MatDialogContent } from '@angular/material/dialog';
import { AddressBookAction, AddressDialog, BuildingType, IAddress, Province } from './addressDialog';
import { Category, ICategory } from './category';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DriverTip } from '../checkout/checkout';
import { IPayMethod } from '../user/user';
import { AutoComplete } from "./googleMaps";

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
        { label: "Tomorrow", time: 0, slots: [{ start: 10, end: 12, am: true }, { start: 10, end: 12, am: true }, { start: 10, end: 12, am: true }, { start: 10, end: 12, am: true }, { start: 10, end: 12, am: true }, { start: 10, end: 12, am: true }] },
        { label: "Day After", time: 200, slots: [{ start: 10, end: 12, am: true }, { start: 10, end: 12, am: true }, { start: 10, end: 12, am: true }] }
      ];
    }
    // Pickup
    else if (mode == DeliveryMode.Pickup) {
      slots = [
        { label: "Today", time: 0 },
        { label: "Tomorrow", time: 0, slots: [{ start: 10, end: 12, am: true }, { start: 10, end: 12, am: true }, { start: 10, end: 12, am: true }] },
        { label: "Wednessday", time: 500 }
      ];
    }

    // commit change
    this._timeSlots.next(slots);
  }

  public setAddressBook(mode: DeliveryMode) {
    // reset address book
    this._addressBook.next([]);

    // Delivery
    if (mode == DeliveryMode.Delivery) {
      // load user address book
    }
    // Pickup
    else if (mode == DeliveryMode.Pickup) {
      // load pickup locations
      this.addAddress({
        label: "BakeSale",
        addressLine: "Area 51",
        city: "Winnipeg",
        province: Province.MB,
        postal: "R1W 2G3"
      });
    }
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

  public getDeliveryFee(): number {
    return 4.00;
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
  selector: 'address-list',
  imports: [FormsModule, FontAwesomeModule],
  template: `
@for (addy of list; track $index) {
<div [class]="'rounded-box p-2' + ' ' + (selected == addy ? 'bg-base-300' : '')">
  <div class="flex items-center gap-4">
    @switch (addy.buildingType) {
    @case (buildingType.Appartment) {
    <fa-icon class="text-xl" icon="building"></fa-icon>
    }
    @case (buildingType.Hotel) {
    <fa-icon class="text-xl" icon="hotel"></fa-icon>
    }
    @case (buildingType.House) {
    <fa-icon class="text-xl" icon="house"></fa-icon>
    }
    @case (buildingType.Office) {
    <fa-icon class="text-xl" icon="building"></fa-icon>
    }
    @default {
    <fa-icon class="text-xl" icon="location-dot"></fa-icon>
    }
    }

    <div class="flex flex-col w-full">        
      <a class="cursor-pointer" (click)="select(addy)">
        <p class="text-lg text-wrap font-bold">
          {{ addy.label }}
          @if (addy.isFavourite) {
          <fa-icon class="opacity-65 text-xs" icon="star"></fa-icon>
          }
        </p>
      </a>

      <div class="flex justify-between gap-2 items-start">
        <a class="cursor-pointer" (click)="select(addy)">
          <p class="text-left text-xs text-wrap">
            {{ printAddress(addy) }}         
          </p>
        </a>

        <div class="flex gap-2">
          @if (editable) {
          <a class="link font-medium" style="text-decoration: 1;" (click)="openAddressBookDialog(addy)">
            Edit
          </a>
          }
          @if (viewable) {
          <a class="link font-medium text-nowrap" style="text-decoration: 1;">
            View Map
          </a>
          }
        </div>
      </div>
    </div>
  </div>
</div>
}   
`
})
export class AddressList {

  protected readonly buildingType = BuildingType;

  protected printAddress = AddressBook.printAddress;

  @Input()
  public list: IAddress[] = [];

  @Input()
  public selected?: IAddress;

  @Input()
  public editable: boolean = true;

  @Input()
  public viewable: boolean = true;

  @Output()
  public onSelect = new EventEmitter<IAddress>();

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef) { }

  protected openAddressBookDialog(address?: IAddress, lookup?: string) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = { address: address, lookup: lookup };
    dialogConfig.width = '90%';

    const dialogRef = this.dialog.open(AddressDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  protected select(address: IAddress) {
    if (this.selected != address) {
      this.selected = address;

      this.onSelect.emit(address);
    }
  }
}


@Component({
  selector: 'address-book',
  imports: [FormsModule, FontAwesomeModule, AddressList],
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

  protected printTimeslot = AddressBook.printTimeslot;

  @Input()
  public timeslot: boolean = false;

  @Output()
  public change = new EventEmitter<void>();

  protected readonly addressBookAction = AddressBookAction;
  protected readonly currentLocation = AddressBook.CurrentLocation;

  protected settings: IDeliverySettings = AddressBook.DefaultSettings;
  protected addressBook: IAddress[] = [];
  protected timeSlots: ITimeSlot[] = [];

  protected selectedAddress: IAddress | undefined = undefined;

  protected get deliveryModes() {
    return Array.from(AddressBook.DeliveryModes.entries());
  }

  protected get deliveryMode() {
    return AddressBook.DeliveryModes.get(this.settings.mode);
  }

  protected get isDelivery(): boolean {
    return (this.settings.mode == DeliveryMode.Delivery);
  }

  protected get favouriteAddresses(): IAddress[] {
    let ret: IAddress[] = [];
    for (let addy of this.addressBook) {
      if (addy.isFavourite) {
        ret.push(addy);
      }
    }
    return ret;
  }

  protected get addresses(): IAddress[] {
    let ret: IAddress[] = [];
    for (let addy of this.addressBook) {
      if (addy.isFavourite == undefined || addy.isFavourite == false) {
        ret.push(addy);
      }
    }
    return ret;
  }

  constructor(
    private deliveryService: DeliveryService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.deliveryService.deliverySettings$.subscribe(data => {
      this.settings = data;
      this.cdr.detectChanges();
    });

    this.deliveryService.timeSlots$.subscribe(data => {
      this.timeSlots = data;
      this.cdr.detectChanges();
    });

    this.deliveryService.addressBook$.subscribe(data => {
      this.addressBook = data;

      // Check if previously selected address exists
      if (this.settings.address) {
        this.selectedAddress = this.addressBook.find(addy => (addy == this.settings.address));
      }

      // Select first address if the current selection is undefined
      if (!this.selectedAddress) {
        this.selectedAddress = data.length > 0 ? data[0] : undefined;
        // update deliverySettings
        this.onAddressChange(this.selectedAddress);
      }

      this.cdr.detectChanges();
    });
  }

  protected onAddressChange(address?: IAddress, favourite?: boolean) {
    this.settings.address = address;
    this.deliveryService.setDeliverySetting(this.settings);

    this.change.emit();
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

  protected openAddressBookDialog(address?: IAddress, lookup?: string) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.panelClass = "";
    dialogConfig.data = { address: address, lookup: lookup };
    dialogConfig.width = '90%';

    const dialogRef = this.dialog.open(AddressDialog, dialogConfig);

    dialogRef.afterClosed().subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  static printAddress(address: IAddress): string {
    return address.addressLine
    + (address.apt ? (' #' + address.apt) : '') + ', ' 
    + address.city + ' • ' 
    + address.province + ' ' 
    + address.postal;
  }

  static printTimeslot(timeslot: ITime): string {
    return timeslot.start + ':00 - ' + timeslot.end + ':00 ' + (timeslot.am ? 'AM' : 'PM');
  }
};


@Component({
  imports: [FormsModule, FontAwesomeModule, AddressBook, MatDialogContent],
  template: `
<div class="bg-base-200">
  <div mat-dialog-content>
    <address-book [timeslot]="showTimeslots" />
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
};
