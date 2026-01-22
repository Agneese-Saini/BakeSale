import { ChangeDetectorRef, Component, Inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogActions, MatDialogContent, MatDialogModule } from "@angular/material/dialog";
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddressBook, DeliveryService, IDeliverySettings } from "./delivery";

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
  instruction?: string,
  //country?: string // For now only in Canada!
  map?: IGoogleMap,
  isTemp?: boolean
};

@Component({
  imports: [FormsModule, FontAwesomeModule, MatDialogModule],
  templateUrl: './addressDialog.html',
})
export class AddressDialog {

  protected errorTypes = ErrorTypes;
  protected buildingType = BuildingType;

  protected lookupAddress?: string;
  protected address: IAddress;
  protected originalName: string;

  protected addressBook: IAddress[] = [];
  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;

  protected showAddressInfo: boolean = false;
  protected temporaryAddress: boolean = false;

  private errors: Map<ErrorTypes, { value: boolean, message?: string }> = new Map();

  protected get provinceList() {
    return Object.values(Province);
  }

  protected get buildingTypes() {
    return Object.values(BuildingType);
  }

  protected get isValidAddress(): boolean {
    return this.address.map != undefined;
  }

  protected get isValidAddressInfo(): boolean {
    return this.error(ErrorTypes.AddressLine) == undefined &&
      this.error(ErrorTypes.City) == undefined &&
      this.error(ErrorTypes.PostalCode) == undefined;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: IAddress,
    private deliveryService: DeliveryService,
    private dialogRef: MatDialogRef<AddressDialog>,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef) {

    if (data) {
      this.address = structuredClone(data);

      // When "CurrentLocation" is supplied, that means we are trying to Add new address
      if (this.data == AddressBook.CurrentLocation) {
        this.useCurrentLocation();
      }
      else {
        // We are trying to Edit an existing address
        this.address.map = {};
      }

      if (this.address.isTemp) {
        this.temporaryAddress = true;
      }
    }
    else {
      this.address = {
        label: "",
        addressLine: ""
      };
    }

    this.originalName = this.address.label;

    if (!this.address.province) {
      this.address.province = this.provinceList[0];
    }

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

  protected onSaveAddress(tempAddress?: boolean) {
    if (this.checkAddressForErrors()) {
      const message = "Address entered doesn't appear to exist.";
      this.snackBar.open(message, "Close", {
        duration: 2500
      });

      return;
    }

    this.address.isTemp = tempAddress;

    // Save address
    if (this.isValidAddress) {
      this.deliveryService.editAddress(this.originalName, this.address);
    }
    // Add address
    else {
      this.deliveryService.addAddress(this.address);
    }

    this.deliverySettings.address = this.address;
    this.deliveryService.setDeliverySetting(this.deliverySettings);

    this.dialogRef.close();
  }

  protected onDeleteAddress(label: string) {
    this.deliveryService.deleteAddress(label);

    const message = this.address.label + ": was removed from your address book.";
    const snackBarRef = this.snackBar.open(message, "Undo", {
      duration: 2500
    });

    snackBarRef.onAction().subscribe(action => {
      this.deliveryService.addAddress(this.address);
    });

    this.dialogRef.close();
  }

  protected onCancel() {
    this.dialogRef.close();
  }

  protected updateTemporaryAddress() {
    if (!this.temporaryAddress) {
      const message = "Address will be saved in your Address Book.";
      this.snackBar.open(message, "Close", {
        duration: 2500
      });
    } else {
      this.snackBar.dismiss();
    }
  }

  private checkAddressForErrors() {
    // Address Line
    if (!this.address.addressLine || this.address.addressLine.length < 4) {
      this.setError(ErrorTypes.AddressLine, "Invalid address entered");
    }

    // City
    if (!this.address.city || this.address.city.length < 4) {
      this.setError(ErrorTypes.City, "Invalid city entered");
    }

    // PostalCode
    if (!this.address.postal || this.address.postal.length < 6) {
      this.setError(ErrorTypes.PostalCode, "Invalid postal code entered");
    }

    // Label
    if (!this.address.label || this.address.label.length < 1) {
      this.setError(ErrorTypes.Label, "No name entered");
    }
    else {
      if (this.originalName && this.address.label != this.originalName) {
        for (let addy of this.addressBook) {
          if (addy.label == this.address.label) {
            this.setError(ErrorTypes.Label, "Name already exist");
            break;
          }
        }
      }
    }

    // Returns TRUE if there were errors found in the address entered
    return this.errors.size != 0;
  }

  protected useCurrentLocation() {
    this.lookupAddress = "Current Location";
  }

  protected error(type: ErrorTypes) {
    const err = this.errors.get(type);
    if (err && err.value) {
      return err;
    }

    return undefined;
  }

  protected get numErrors() {
    return this.errors.size;
  }

  protected setError(type: ErrorTypes, message?: string) {
    this.errors.set(type, { value: true, message: message });
  }

  protected clearError(type: ErrorTypes) {
    this.errors.delete(type);
  }
};
