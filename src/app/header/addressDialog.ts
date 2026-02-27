import { ChangeDetectorRef, Component, Inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from "@angular/material/dialog";
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddressBook, DeliveryService, IDeliverySettings } from "./addressBook";
import { GoogleMapsModule } from "@angular/google-maps";
import { AutoComplete } from "./googleMaps";

export enum BuildingType {
  House = 'House',
  Appartment = 'Appartment',
  Office = 'Office',
  Hotel = 'Hotel',
  Other = 'Other'
};

export enum Province {
  ON = 'Ontario',
  MB = 'Manitoba'
};

export enum AddressBookAction {
  ViewOnly,
  Edit,
  Current,
  Add
};

export enum ErrorTypes {
  LookupAddress,
  AddressLine,
  City,
  PostalCode,
  Apt,
  Label
};

export interface IGoogleMap {
  lat?: number,
  log?: number
};

export interface IAddress {
  label: string,
  addressLine: string, // larger font
  city?: string,
  province?: Province,
  postal?: string,
  buildingType?: BuildingType,
  apt?: string,
  mustMeet?: boolean,
  position?: { lat: number, lng: number },
  instruction?: string,
  //country?: string // For now only in Canada!
  map?: IGoogleMap,
  isFavourite?: boolean
};

@Component({
  imports: [FormsModule, FontAwesomeModule, MatDialogModule, GoogleMapsModule, AutoComplete],
  templateUrl: './addressDialog.html',
})
export class AddressDialog {

  protected errorTypes = ErrorTypes;
  protected buildingType = BuildingType;

  protected address: IAddress;
  protected originalName: string;

  protected addressBook: IAddress[] = [];
  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;

  protected showAddressInfo: boolean = false;
  protected searchResult?: IAddress;
  protected searchQuery?: string;

  protected mapCenter: google.maps.LatLngLiteral = { lat: 34.0522, lng: -118.2437 };
  protected mapZoom: number = 15;
  protected markerPosition: google.maps.LatLngLiteral = { lat: 34.0522, lng: -118.2437 };
  protected markerOptions: google.maps.MarkerOptions = { draggable: false };

  private errors: Map<ErrorTypes, string | undefined> = new Map();

  protected get provinceList() {
    return Object.values(Province);
  }

  protected get buildingTypes() {
    return Object.values(BuildingType);
  }

  protected get isAnExistingAddress(): boolean {
    return this.address.map != undefined;
  }

  protected get isValidAddress(): boolean {
    return this.getError(ErrorTypes.AddressLine) == undefined &&
      this.getError(ErrorTypes.City) == undefined &&
      this.getError(ErrorTypes.PostalCode) == undefined;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: { address?: IAddress, lookup?: string },
    private deliveryService: DeliveryService,
    private dialogRef: MatDialogRef<AddressDialog>,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef) {

    this.searchQuery = data.lookup;

    if (data.address) {
      this.address = structuredClone(data.address);

      // When "CurrentLocation" is supplied, that means we are trying to Add new address
      if (this.data.address == AddressBook.CurrentLocation) {
        this.useCurrentLocation();
      }

      if (this.isValidAddress) {
        this.showAddressInfo = true;
      }
    }
    else {
      this.address = {
        label: "", 
        addressLine: ""
      };
    }

    this.originalName = this.address.label;

    // Default province
    if (!this.address.province) {
      this.address.province = this.provinceList[0];
    }

    // Default building type
    if (!this.address.buildingType) {
      this.address.buildingType = this.buildingTypes[0];
    }
  }

  protected ngOnInit() {
    this.deliveryService.addressBook$.subscribe(data => {
      this.addressBook = data;
      this.cdr.detectChanges();
    });

    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;
      this.cdr.detectChanges();
    });
  }

  protected saveAddress() {
    if (this.checkAddressForErrors()) {
      const message = "There appears to be some errors in the address entered.";
      this.snackBar.open(message, "Close", {
        duration: 2500
      });

      return;
    }

    // Update address
    if (this.isAnExistingAddress) {
      this.deliveryService.editAddress(this.originalName, this.address);
    }
    // Add address
    else {
      this.deliveryService.addAddress(this.address);
      // Update delivery settings
      this.deliverySettings.address = this.address;
      this.deliveryService.setDeliverySetting(this.deliverySettings);
    }

    this.dialogRef.close();
  }

  protected deleteAddress(label: string) {
    this.deliveryService.deleteAddress(label);

    const message = this.address.label + " was removed from your address book.";
    const snackBarRef = this.snackBar.open(message, "Undo", {
      duration: 2500
    });

    snackBarRef.onAction().subscribe(action => {
      this.deliveryService.addAddress(this.address);
    });

    this.dialogRef.close();
  }

  protected cancel() {
    this.dialogRef.close();
  }

  protected checkLabelForErrors() {
    const label = this.address.label.toLowerCase().trim();
    if (label.length == 0) {
      this.errors.set(ErrorTypes.Label, "Please enter a name");
      return;
    }

    if (label.length < 3) {
      this.errors.set(ErrorTypes.Label, "Name is too short");
      return;
    }

    for (let addr of this.addressBook) {
      if (addr != this.data.address && label == addr.label.toLowerCase().trim()) {
        this.errors.set(ErrorTypes.Label, "Name already exists");
        return;
      }
    }

    this.clearError(ErrorTypes.Label);
  }

  private checkAddressForErrors() {
    // Address Line
    if (!this.address.addressLine || this.address.addressLine.trim().length == 0) {
      this.setError(ErrorTypes.AddressLine, "Please enter an address");
    }
    else if (this.address.addressLine.length < 4) {
      this.setError(ErrorTypes.AddressLine, "Invalid address entered");
    }

    // City
    if (!this.address.city || this.address.city.trim().length == 0) {
      this.setError(ErrorTypes.City, "Please enter city name");
    }
    else if (this.address.city.length < 3) {
      this.setError(ErrorTypes.City, "Invalid city name entered");
    }

    // PostalCode
    if (!this.address.postal || this.address.postal.trim().length == 0) {
      this.setError(ErrorTypes.PostalCode, "Please enter postal code");
    }
    else if (this.address.postal.length < 6) {
      this.setError(ErrorTypes.PostalCode, "Invalid postal code entered");
    }

    // Label
    this.checkLabelForErrors();

    // Returns TRUE if there were errors found in the address entered
    return this.errors.size != 0;
  }

  protected useCurrentLocation() {
  }

  protected onAutoCompleteSelect(params: { address: IAddress, prediction: string }) {
    this.address.label = params.address.label;
    this.address.addressLine = params.address.addressLine;
    this.address.city = params.address.city;
    this.address.province = params.address.province;
    this.address.postal = params.address.postal;

    if (params.address.position) {
      this.address.position = params.address.position;
      this.mapCenter = this.markerPosition = params.address.position;
    }

    this.showAddressInfo = true;
  }

  protected onAutoCompleteChange() {
  }

  protected get numErrors() {
    return this.errors.size;
  }

  protected setError(type: ErrorTypes, message?: string) {
    this.errors.set(type, message);
  }

  protected getError(type: ErrorTypes) {
    return this.errors.get(type);
  }

  protected clearError(type: ErrorTypes) {
    this.errors.delete(type);
  }
};
