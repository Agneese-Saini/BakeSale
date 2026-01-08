import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DecimalPipe, KeyValuePipe } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IItem, Item } from "./item";
import { ItemDialog } from "./itemDialog";
import _ from "lodash";

export interface IChoiceType {
  name: string,
  description?: string,
  limit?: number,
  required?: boolean,
  error?: string
};

export interface IChoice {
  name: string,
  amount?: number,
  about?: string,
  price?: number,
  icon?: string,
  extraid?: number
};

export type ChoiceList = Map<IChoiceType, IChoice[]>;

@Component({
  selector: 'item-choice',
  imports: [FormsModule, FontAwesomeModule, DecimalPipe],
  template: `
<div class="flex justify-between items-center cursor-pointer">
  <span class="flex flex-col ">
    <p class="text-lg">{{ value.name }}</p>
    @if (value.price != undefined) {
    <p class="text-sm label">{{ (value.price >= 0) ? '+' : '-' }} $ {{ value.price | number: '1.2-2' }}</p>
    }
    <i class="text-sm font-thin pl-2">{{ value.about }}</i>
  </span>

  @if (limit && limit > 1) {
  <div class="flex justify-center items-center gap-2">
    @if (value.amount != undefined && value.amount > 0) {
    <button class="btn btn-circle btn-ghost" (click)="decrease()">
      @if (value.amount == 1) {
      <fa-icon class="text-error" icon="trash"></fa-icon>
      } @else {
      <fa-icon icon="minus"></fa-icon>
      }
    </button>

    <b class="text-lg">{{ value.amount }}</b>
    }

    <button [class]="'btn btn-circle ' + (value.amount ? 'btn-ghost' : '')" (click)="increase()">
      <fa-icon icon="plus"></fa-icon>
    </button>
  </div>
  }
  @else {
  @if (!value.amount) {
  <button [class]="'btn btn-circle ' + (value.amount ? 'btn-ghost' : '')" (click)="increase()">
    <fa-icon icon="plus"></fa-icon>
  </button>
  }
  @else {
  <button class="btn btn-ghost btn-circle text-2xl" (click)="decrease()">
    <fa-icon icon="check"></fa-icon>
  </button>
  }
  }
</div>
`
})
export class ItemChoice {

  @Input({ required: true })
  public value!: IChoice;

  @Input({ required: true })
  public type!: IChoiceType;

  @Input()
  public limit?: number;

  @Output()
  public change = new EventEmitter<void>();

  protected ngOnInit() {
    if (this.value.amount == undefined) {
      this.value.amount = 0;
    }
  }

  protected increase() {
    const currAmount = this.value.amount != undefined ? this.value.amount : 0;
    const newAmount = currAmount + 1;
    const maxAmount = this.limit != undefined ? this.limit : Item.DefaultMaxAmount;
    if (newAmount <= maxAmount) {
      this.value.amount = newAmount;
      this.change.emit();
    }
  }

  protected decrease() {
    const currAmount = this.value.amount != undefined ? this.value.amount : 0;
    const newAmount = currAmount - 1;
    if (newAmount >= 0) {
      this.value.amount = newAmount;
      this.change.emit();
    }
  }
};


@Component({
  selector: 'item-choice-list',
  imports: [FormsModule, FontAwesomeModule, ItemChoice],
  template: `

<div tabindex="0" [class]="'collapse collapse-open bg-base-100 rounded-box border ' + (type.error ? 'border-error' : 'border-base-300')">
     <div class="collapse-title">
      <div class="flex justify-between items-center gap-1">
        <div class="flex flex-col">
          <p class="text-xl">
            @if (type.required == true) {
            Choose {{ type.name }}
            } @else {
            Add {{ type.name }}
            }
          </p>

          @if (type.description) {
          <i class="text-gray-500 text-xs pb-1"><fa-icon icon="info-circle"></fa-icon> {{ type.description }}</i>
          }

          @if (type.limit) {
          @let selections = getSelections(choices);
          @let selection = getSelection(choices);
          @if (selections.length == 1 && selection) {
          <label class="text-sm font-bold">
            {{ selection.name }}
            @if (selection.amount && selection.amount > 1) {
            ({{ selection.amount }})
            }
          </label>
          }
          @else if (selections.length > 0) {
          <label [class]="'text-sm font-bold ' + (hasError(type, choices) ? 'text-error' : '')">
            Multiple selected ({{ numSelection(choices) }}/{{ type.limit }})
          </label>
          }
          @else {
          <label class="text-sm label">
          @if (type.required) {
          Please choose {{ type.limit }}
          } @else {
          Choose upto {{ type.limit }}
          }
          </label>
          }
          }
        </div>

        @if (type.error) {
        <p class="text-error text-sm">{{ type.error }}</p>
        } @else {
        @if (type.required && (numSelection(choices) < 1 || (type.limit && numSelection(choices) < type.limit))) {
        <label class="label font-thin">Required</label>
        }
        }
      </div>
    </div>

    <div class="collapse-content bg-base-300">
      <div class="">      
        <div class="max-h-64 overflow-y-auto">
          <table class="table w-full">
            <tbody>
              @for (choice of choices; track choice) {
              <tr>
                <td>
                  <item-choice 
                      [value]="choice" 
                      [type]="type" 
                      [limit]="type.limit" 
                      (change)="onChange(choice)" />
                </td>
              </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
</div>
`
})
export class ItemChoiceList {

  @Input({ required: true })
  public type!: IChoiceType;

  @Input({ required: true })
  public choices!: IChoice[];

  protected onChange(choice: IChoice) {
    // Clear errors
    this.type.error = undefined;

    if (!this.type.limit || this.type.limit == 1) {
      if (choice.amount == 1) {
        for (let c of this.choices) {
          if (c != choice) {
            c.amount = 0;
          }
        }
      }
    }
  }

  static HasError(type: IChoiceType, choices: IChoice[], skipNonSelection?: boolean) {
    if (type.error) {
      return true;
    }

    if (skipNonSelection == true && ItemChoiceList.NumSelection(choices) == 0)
      return false;

    if (type.limit && ItemChoiceList.NumSelection(choices) > type.limit) {
      return true;
    }

    if (type.required && (ItemChoiceList.NumSelection(choices) < (type.limit ? type.limit : 1))) {
      return true;
    }

    return false;
  }

  protected hasError = ItemChoiceList.HasError;

  static ShowError(type: IChoiceType, choices: IChoice[]): boolean {
    if (type.limit && ItemChoiceList.NumSelection(choices) > type.limit) {
      type.error = "Only select " + type.limit;
      return true;
    }

    if (type.required && (ItemChoiceList.NumSelection(choices) < (type.limit ? type.limit : 1))) {
      type.error = "Please select " + type.limit;
      return true;
    }

    type.error = undefined;
    return false;
  }

  static NumSelection(choices: IChoice[]) {
    let num = 0;
    for (const choice of choices) {
      if (choice.amount != undefined && choice.amount > 0) {
        num += Number(choice.amount);
      }
    }

    return num;
  }

  protected numSelection = ItemChoiceList.NumSelection;

  static GetSelection(choices: IChoice[]) {
    for (const choice of choices) {
      if (choice.amount != undefined && choice.amount > 0) {
        return choice;
      }
    }

    return undefined;
  }

  protected getSelection = ItemChoiceList.GetSelection;

  static GetSelections(choices: IChoice[]) {
    let selections: IChoice[] = [];

    for (const choice of choices) {
      if (choice.amount != undefined && choice.amount > 0) {
        selections.push(choice);
      }
    }

    return selections;
  }

  protected getSelections = ItemChoiceList.GetSelections;

  static GetChoice(choices: ChoiceList, type: string): IChoice | undefined {
    for (const [key, value] of choices) {
      if (key.name.includes(type) && key.limit == 1) {
        return ItemChoiceList.GetSelection(value);
      }
    }

    return undefined;
  }

  protected getChoice = ItemChoiceList.GetChoice;

  static Reset(choices: IChoice[]) {
    for (const choice of choices) {
      choice.amount = 0;
    }
  }
};


@Component({
  selector: 'item-choice-catalog',
  imports: [FormsModule, FontAwesomeModule, KeyValuePipe],
  template: `
<div class="flex flex-wrap gap-0">
  @let list = getChoiceList();
  @for (entry of list | keyvalue; track entry.key) {
  @let selection = getSelection(entry.value);
  @let lastSelection = selection.at(selection.length - 1);
  <label class="flex gap-0 label text-xs">
    @for (choice of selection; track choice) {
    @if (choice.icon) {
    <fa-icon [icon]="choice.icon"></fa-icon>
    } @else {
    <fa-icon icon="bowl-food"></fa-icon>
    }
    {{ choice.name }}
    @if (choice.amount && choice.amount > 1) {
    <b>({{ choice.amount }})</b>
    }
    @if (choice != lastSelection) {
    {{ ', '}}
    }
    }
  </label>
  @if (entry.key != lastChoice) {
  <label class="label text-xs">{{ ', ' }}</label>
  }
  }
</div>
`
})
export class ItemChoiceCatalog {

  @Input({ required: true })
  public value?: ChoiceList;

  protected lastChoice?: IChoiceType;

  protected getChoiceList(): ChoiceList {
    let ret: ChoiceList = new Map();

    if (this.value) {
      for (let [key, value] of this.value) {
        if (this.numSelection(value) > 0) {
          ret.set(key, value);
        }
      }

      this.lastChoice = [...ret.keys()].at(-1);
    }

    return ret;
  }

  protected getSelection(choices: IChoice[]): IChoice[] {
    let ret: IChoice[] = [];

    for (let choice of choices) {
      if (choice.amount && choice.amount > 0) {
        ret.push(choice);
      }
    }

    return ret;
  }

  protected numSelection(choices: IChoice[]): number {
    let count = 0;
    for (let choice of choices) {
      if (choice.amount && choice.amount > 0) {
        count += Number(choice.amount);
      }
    }

    return count;
  }
};


@Component({
  selector: 'item-choice-summary',
  imports: [FormsModule, FontAwesomeModule, KeyValuePipe],
  template: `
@for (entry of value | keyvalue; track entry.key) {
@if (numSelection(entry.value) > 0) {
<label class="text-xs label">
  {{ entry.key.name }}{{ numChoices(entry.value) > 1 ? ('(' + numSelection(entry.value) + ')') : '' }}:
</label>
<br/>

<span class="flex flex-col text-gray-500">
  @for (choice of entry.value; track choice) {
  @if (choice.amount && choice.amount > 0) {
  <label class="flex gap-1 text-xs px-1">
    @if (choice.icon) {
    <fa-icon [icon]="choice.icon"></fa-icon>
    } @else {    
    <fa-icon icon="bowl-food"></fa-icon>
    }
    
    <label>
      {{ choice.name }}
      @if (choice.amount > 1) {
      <b>({{ choice.amount }})</b>
      }
    </label>
  </label>
  }
  }
</span>
}
}
`
})
export class ItemChoiceSummary {

  @Input({ required: true })
  public value?: ChoiceList;

  protected numSelection(choices: IChoice[]): number {
    let count = 0;
    for (let choice of choices) {
      if (choice.amount && choice.amount > 0) {
        count += Number(choice.amount);
      }
    }

    return count;
  }

  protected numChoices(choices: IChoice[]): number {
    let count = 0;
    for (let choice of choices) {
      if (choice.amount && choice.amount > 0) {
        count++;
      }
    }

    return count;
  }
};