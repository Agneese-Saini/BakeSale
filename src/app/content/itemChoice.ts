import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DecimalPipe, KeyValuePipe } from "@angular/common";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IItem, Item } from "./item";
import { ItemDialog } from "./itemDialog";
import _ from "lodash";

export interface IChoiceType {
  name: string,
  tooltip?: string,
  limit?: number,
  required?: boolean,
  error?: string,
  selected?: IChoice
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
@if (limit && limit > 1) {
<div class="flex justify-between items-center cursor-pointer">
  <span class="flex flex-col ">
    <p class="text-lg">{{ value.name }}</p>
    @if (value.price != undefined) {
    <p class="text-sm label">{{ (value.price >= 0) ? '+' : '-' }} $ {{ value.price | number: '1.2-2' }}</p>
    }
    <i class="text-sm font-thin pl-2">{{ value.about }}</i>
  </span>

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

    <button [class]="'btn btn-circle ' + (!value.amount ? 'btn-' : 'btn-ghost')" (click)="increase()">
      <fa-icon icon="plus"></fa-icon>
    </button>
  </div>
</div>
}
@else {
<label class="flex justify-between items-center cursor-pointer">
  <span class="flex flex-col ">
    <p class="text-lg">{{ value.name }}</p>
    @if (value.price != undefined) {
    <p class="text-sm label">{{ (value.price >= 0) ? '+' : '-' }} $ {{ value.price | number: '1.2-2' }}</p>
    }
    <i class="text-sm font-thin pl-2">{{ value.about }}</i>
  </span>

  <input type="radio" class="radio m-2" [name]="type.name" [value]="value" [(ngModel)]="type.selected" (change)="change.emit()" />
</label>
}
`
})
export class ItemChoice {

  @Input({ required: true })
  public value: IChoice = {
    name: "Unknown",
    amount: 0
  };

  @Input({ required: true })
  public type: IChoiceType = { name: "Unknown" };

  @Input()
  public limit?: number;

  @Output()
  public change = new EventEmitter<void>();

  protected get list(): number[] {
    if (this.limit != undefined && this.limit > 1) {
      return ItemDialog.numberList(0, this.limit);
    }
    return ItemDialog.numberList(0, 1);
  }

  protected ngOnInit() {
    if (this.value.amount == undefined) {
      this.value.amount = this.list[0];
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
  selector: 'item-choice-catalog',
  imports: [FormsModule, FontAwesomeModule, KeyValuePipe],
  template: `
<div class="flex flex-wrap gap-1 justify-center">
  @let list = getChoiceList();
  @for (entry of list | keyvalue; track entry.key) {
  @let selection = getSelection(entry.value);
  @let lastSelection = selection.at(selection.length - 1);
  <label class="label text-sm">
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
  <label class="label text-sm">, </label>
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
<label class="text-sm label">
  {{ entry.key.name }} {{ numChoices(entry.value) > 1 ? ('(' + numSelection(entry.value) + ')') : '' }}:
</label>
<br/>

<span class="flex flex-col text-gray-500">
  @for (choice of entry.value; track choice) {
  @if (choice.amount && choice.amount > 0) {
  <label class="text-xs px-1">
    @if (choice.icon) {
    <fa-icon [icon]="choice.icon"></fa-icon>
    } @else {    
    <fa-icon icon="bowl-food"></fa-icon>
    }
    {{ choice.name }}
    @if (choice.amount > 1) {
    <b>({{ choice.amount }})</b>
    }
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


@Component({
  selector: 'item-choice-list',
  imports: [FormsModule, FontAwesomeModule, ItemChoice, KeyValuePipe],
  template: `
<div class="flex flex-col gap-2">
  @for (entry of choices | keyvalue; track entry.key) {
  <div tabindex="0" [class]="'collapse collapse-open bg-base-100 rounded-box border ' + (entry.key.error ? 'border-error' : 'border-base-300')">
     <div class="collapse-title">
      <div class="flex justify-between items-center text-xl">
        <div class="flex flex-col">
          <div class="flex gap-2">
            <p>
              @if (entry.key.required == true) {
              Choose {{ entry.key.name }}
              } @else {
              Add {{ entry.key.name }}
              }
            </p>

            @if (entry.key.tooltip) {
            <fa-icon class="text-sm tooltip tooltip-right" icon="info-circle" [attr.data-tip]="entry.key.tooltip"></fa-icon>
            }
          </div>

          @if (entry.key.limit) {
          @let selections = getSelections(entry.value);
          @let selection = getSelection(entry.value);
          @if (selections.length == 1 && selection) {
          <label class="text-sm font-bold">
            {{ selection.name }}
            @if (selection.amount && selection.amount > 1) {
            ({{ selection.amount }})
            }
          </label>
          }
          @else if (selections.length > 0) {
          <label [class]="'text-sm font-bold ' + (hasError(entry.key, entry.value) ? 'text-error' : '')">
            Multiple selected ({{ numSelection(entry.value) }}/{{ entry.key.limit }})
          </label>
          }
          @else {
          <label class="text-sm label">
          @if (entry.key.required) {
          Please choose {{ entry.key.limit }}
          } @else {
          Choose upto {{ entry.key.limit }}
          }
          </label>
          }
          }
        </div>

        @if (entry.key.error) {
        <p class="text-error text-sm">{{ entry.key.error }}</p>
        } @else {
        @if (entry.key.required && (numSelection(entry.value) < 1 || (entry.key.limit && numSelection(entry.value) < entry.key.limit))) {
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
              @for (choice of entry.value; track choice) {
              <tr>
                <td>
                  <item-choice 
                      [value]="choice" 
                      [type]="entry.key" 
                      [limit]="entry.key.limit" 
                      (change)="onChange(entry.key)" />
                </td>
              </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>          
  }
</div>

`
})
export class ItemChoiceList {

  @Input({ required: true })
  public choices: ChoiceList = new Map();

  protected onChange(choiceType: IChoiceType) {
    // Clear errors
    choiceType.error = undefined;

    if (choiceType.limit && choiceType.limit == 1) {
      const choices = this.choices.get(choiceType);
      if (choices) {
        for (let choice of choices) {
          choice.amount = Number(choice == choiceType.selected);
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
};