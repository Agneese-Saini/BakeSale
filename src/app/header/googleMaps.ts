import { Component, EventEmitter, input, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BuildingType, IAddress, Province } from './addressDialog';
import { AddressBook } from './addressBook';

@Component({
  selector: 'maps-autocomplete',
  imports: [FormsModule, FontAwesomeModule],
  template: `
<div class="flex gap-2">
  <input 
    type="search" 
    tabindex="-1"
    class="input input-bordered placeholder-gray-350 w-full" 
    placeholder="Search an address"
    [(ngModel)]="searchQuery" 
    (input)="onInputChange()" />

  @if (hidden == true) {
  <button class="btn btn-neutral tooltip tooltip-left" data-tip="Use Current Location" (click)="useCurrentLocation()">
    <fa-icon icon="location-crosshairs"></fa-icon>
  </button>
  }
</div>

@if (error) {
<div class="flex gap-1 p-1">
  <fa-icon class="text-error text-sm" icon="exclamation-circle"></fa-icon>
  <p class="font-mono text-sm text-error pb-2">{{ error }}</p>
</div>
}

@if (hidden == false) {
<div class="bg-base-100 border border-neutral-300 rounded-box w-full mt-2" >
  <div class="flex flex-col gap-1">
    <ul class="menu w-full gap-1">
      <div class="bg-base-200">
        <li (click)="useCurrentLocation()">
          <p class="justify-center p-2">
            <fa-icon icon="location-crosshairs"></fa-icon> Use Current Location
          </p>
        </li>
      </div>
    </ul>

    @if (addressBookResults.length > 0) {
    <div class="divider m-2">Saved Address</div>
    <ul class="menu w-full gap-1">
      @for (result of addressBookResults; track $index) {
      <div class="bg-base-200 flex justify-between items-center">
        <li class="flex-1" (click)="selectPlace(result.label, result)">
          <div class="flex flex-col items-start gap-0 rounded-box p-2">
            <b>{{ result.label }}</b>
            <p class="text-sm">{{ result.addressLine }}</p>
          </div>
        </li>
        <span class="label tooltip tooltip-left" data-tip="View on Map">
          <a class="btn btn-ghost btn-circle text-xl">
            <fa-icon icon="map-location-dot"></fa-icon>
          </a>
        </span>
      </div>
      }
    </ul>
    }

    @if (searchResults.length > 0) {
    <div class="divider m-2">Search Results</div>
    <ul class="menu w-full gap-1">
      @for (result of searchResults; track $index) {
      <div class="bg-base-200 flex justify-between items-center">
        <li class="flex-1" (click)="selectPlace(result.label, result.address)">
          <p>{{ result.label }}</p>
        </li>
        <span class="label tooltip tooltip-left" data-tip="View on Map">
          <a class="btn btn-ghost btn-circle text-xl">
            <fa-icon icon="map-location-dot"></fa-icon>
          </a>
        </span>
      </div>
      }
    </ul>
    }
  </div>
</div>
}
  `,
})
export class AutoComplete {

  @Input()
  public searchQuery?: string;

  @Input()
  public hidden: boolean = false;

  @Output()
  public select = new EventEmitter<{ address: IAddress, prediction: string }>();

  @Output()
  public resultChange = new EventEmitter<void>();

  protected searchResults: { label: string, address: IAddress }[] = [];
  protected addressBookResults: IAddress[] = [];
  protected error?: string;

  protected onInputChange() {
    const input = this.searchQuery ? this.searchQuery.trim() : '';

    if (input.length > 1) {
      this.searchPlaces(input);
    } else {
      this.searchResults = [];
      this.addressBookResults = [];
    }
  }

  protected async searchPlaces(query: string) {
    const { AutocompleteSessionToken, AutocompleteSuggestion } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

    const request: google.maps.places.AutocompleteRequest = {
      input: query,
      region: "ca"
    };

    // Create a session token.
    const token = new AutocompleteSessionToken();
    // Add the token to the request.
    // @ts-ignore
    request.sessionToken = token;

    // Fetch autocomplete suggestions.
    const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

    // clear previous suggestions
    this.searchResults = [];
    this.addressBookResults = [];

    for (let suggestion of suggestions) {
      const placePrediction = suggestion.placePrediction;
      if (placePrediction) {
        const place = placePrediction.toPlace();
        await place.fetchFields({
          fields: ['addressComponents', 'displayName'],
        });


        const getComponent = (types: string[]): string | undefined => {
          if (place.addressComponents) {
            for (const type of types) {
              const component = place.addressComponents.find(comp => comp.types.includes(type));
              if (component && component.longText) {
                return component.longText;
              }
            }
          }

          return undefined;
        };

        const addressLine = (getComponent(['street_number']) + " " + getComponent(['route'])).trim();
        let address: IAddress = {
          label: place.displayName ? place.displayName : addressLine,
          addressLine: addressLine,
          city: getComponent(['locality', 'sublocality_level_1', 'postal_town']),
          postal: getComponent(['postal_code']),
          province: Province.MB, //getComponent(['administrative_area_level_1'])
          buildingType: BuildingType.House,
          position: place.location ? { lat: place.location.lat(), lng: place.location.lng() } : undefined
        };

        this.searchResults.push({
          label: placePrediction.text.toString(),
          address: address
        });
      }
    }

    this.resultChange.emit();
  }

  protected selectPlace(label: string, address: IAddress) {
    this.searchQuery = label;
    this.select.emit({ address: address, prediction: label });

    // clear cached addresses
    this.searchResults = [];
    this.addressBookResults = [];
  }

  protected useCurrentLocation() {
    //this.select.emit(AddressBook.CurrentLocation);

    // clear cached addresses
    this.searchResults = [];
    this.addressBookResults = [];
  }
}