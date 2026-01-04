import { ChangeDetectorRef, Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar } from '@angular/material/snack-bar';
import { IDeliverySettings, AddressBook, DeliveryService } from "./delivery";
import { MatDialogModule } from "@angular/material/dialog";

export interface ITime {
  start?: number,
  end?: number
};

export interface ITimeSlot {
  label: string,
  time: number,
  slots?: ITime[]
};

@Component({
  imports: [FormsModule, FontAwesomeModule, MatDialogModule],
  templateUrl: './timeslotDialog.html'
})
export class TimeslotsDialog {

  protected deliverySettings: IDeliverySettings = AddressBook.DefaultSettings;
  protected timeSlots?: ITimeSlot[];

  protected selectedTimeslot?: ITimeSlot;
  protected selectedTimeInterval?: ITime;

  constructor(
    private deliveryService: DeliveryService,
    protected dialogRef: MatDialogRef<TimeslotsDialog>,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef) { }

  protected get isNow() {
    return this.deliverySettings.timeslot == AddressBook.TimeNow;
  }

  protected get deliveryMode() {
    return AddressBook.DeliveryModes.get(this.deliverySettings.mode);
  }

  protected ngOnInit() {

    this.deliveryService.deliverySettings$.subscribe(data => {
      this.deliverySettings = data;
      this.cdr.detectChanges();
    });

    this.deliveryService.timeSlots$.subscribe(data => {
      this.timeSlots = data;

      const oldTimeslot = this.deliverySettings.timeslot;
      const oldInterval = this.deliverySettings.time;

      // selectedTimeslot:
      // If selected timeslot doesn't exist in current list of timeslots
      if (!oldTimeslot || (oldTimeslot != AddressBook.TimeNow && !data.find(value => (value == oldTimeslot)))) {
        // find a similar labeled timeslot
        this.deliverySettings.timeslot = data.find(value => (value.slots && value.label == oldTimeslot?.label));
      }
      
      this.selectedTimeslot = this.deliverySettings.timeslot;
      // If no selection, pick the first slot with intervals present        
      if (!this.selectedTimeslot) {
        this.selectedTimeslot = data.find(value => (value.slots));
      }

      // selectedInterval:
      if (this.deliverySettings.timeslot && this.deliverySettings.timeslot.slots) {
        // find current interval in list
        if (oldInterval) {
          this.deliverySettings.time = this.deliverySettings.timeslot.slots.find(slot => (slot == oldInterval));
        }

        if (!this.deliverySettings.time) {
          // find a similar starting time interval from list
          if (oldInterval) {
            this.deliverySettings.time = this.deliverySettings.timeslot.slots.find(slot => (slot.start == oldInterval.start));
          }
        }
      }
      else {
        // no slots available
        this.deliverySettings.time = undefined;
      }

      this.selectedTimeInterval = this.deliverySettings.time;

      this.deliveryService.setDeliverySetting(this.deliverySettings);

    });
  }

  protected onTimeSlotChange(timeslot: ITimeSlot) {
    this.selectedTimeslot = timeslot;

    if (timeslot.slots) {
      if (!timeslot.slots.find(slot => (slot == this.selectedTimeInterval))) {
        // set to scheduled time interval
        this.selectedTimeInterval = timeslot.slots.find(slot => (slot == this.deliverySettings.time));

        // if no selection
        if (!this.selectedTimeInterval) {
          this.selectedTimeInterval = timeslot.slots[0];
        }
      }
    }
    else {
      this.selectedTimeInterval = undefined;
    }
  }

  protected schedule() {
    if (this.selectedTimeslot && this.selectedTimeInterval) {
      this.deliverySettings.timeslot = this.selectedTimeslot;
      this.deliverySettings.time = this.selectedTimeInterval;

      this.deliveryService.setDeliverySetting(this.deliverySettings);

      // Closes the dialog with passed result
      this.dialogRef.close();
    }
    else {
      this.snackBar.open("No timeslot was selected.", "Close", {
        duration: 2500
      });
    }
  }

  protected placeNow() {
    this.deliverySettings.timeslot = AddressBook.TimeNow;
    this.deliverySettings.time = undefined;

    this.deliveryService.setDeliverySetting(this.deliverySettings);

    // Closes the dialog with passed result
    this.dialogRef.close();
  }

  protected close() {
    // Closes the dialog
    this.dialogRef.close();
  }
}