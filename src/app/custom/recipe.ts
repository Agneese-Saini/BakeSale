import { ChangeDetectorRef, Component } from '@angular/core';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ChoiceList, IChoiceType, ItemChoiceCatalog, ItemChoiceList } from "../content/itemChoice";
import { KeyValuePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { IUser, UserService } from '../user/user';
import { ICustomizer } from '../header/category';

export enum ButtonType {
  Finish,
  Next,
  Back
}

export enum RecipeType {
  Cake,
  CheeseCake,
  Flatbread
}

export enum Category {
  Setup,
  Layering,
  Finish,
  Publish
}

export interface IRecipeGroup {
  name: string,
  choices: ChoiceList,
  buttons: { name: string, type: ButtonType }[],
  instructions?: string,
  skipNonSelection?: boolean
}
export type RecipeGroup = Map<Category, IRecipeGroup>;

export interface IRecipe {
  name: string,
  type: RecipeType,
  value: number,
  recipe: Map<Category, IRecipeGroup>,
  buyHistory: Map<IUser, number>,
  date: number,
  isPrivate?: boolean,
  desc?: string,
}

@Component({
  selector: 'app-recipe',
  imports: [FormsModule, FontAwesomeModule, KeyValuePipe, ItemChoiceList, RouterModule, ItemChoiceCatalog],
  templateUrl: './recipe.html',
  styleUrl: './recipe.css'
})
export class Recipe {

  static readonly PointsPerRecipe = 15;
  static readonly PointsRequiredForRecipe = 0;

  static readonly CustomTypes: Map<RecipeType, { label: string, icon: string }> = new Map([
    [RecipeType.Cake, {
      label: "Cake",
      icon: "cake-candles"
    }],
    [RecipeType.CheeseCake, {
      label: "Cheesecake",
      icon: "cheese"
    }]
  ]);

  static readonly LayerChoices: ChoiceList = new Map([
    [{ name: "Bun Shape", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]],
    [{ name: "Bun Flavor", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]],
    [{ name: "Cake Filling", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]],
    [{ name: "Cake Frosting", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]],
    [{ name: "Addons", limit: 5, required: false }, [{ name: "Option 1" }, { name: "Option 2" }]],
    [{ name: "Finish", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]]
  ]);

  protected customTypes = Recipe.CustomTypes;
  protected buttonType = ButtonType;
  protected category = Category;

  protected categories: RecipeGroup = new Map([
    [Category.Setup, {
      name: "Cake Setup",
      instructions: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac eros sit amet lorem facilisis vulputate at non dui. \
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac eros sit amet lorem facilisis vulputate at non dui.",
      choices:
        new Map([
          [{ name: "Theme", limit: 1, required: true }, [{ name: "Birthday" }, { name: "Office Party" }, { name: "Drunk Fest" }, { name: "Cartoon" }, { name: "Christmas" }]],
          [{ name: "Layers", limit: 1, required: true }, [{ name: "1 Layer", extraid: 1 }, { name: "2 Layers", extraid: 2 }, { name: "3 Layers", extraid: 3 }]]
        ]),
      buttons:
        [{ name: "Next", type: ButtonType.Next }]
    }],
    [Category.Layering, {
      name: "Layering",
      instructions: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac eros sit amet lorem facilisis vulputate at non dui.",
      choices: new Map(),
      buttons:
        [{ name: "Next", type: ButtonType.Next }, { name: "Back", type: ButtonType.Back }]
    }],
    [Category.Finish, {
      name: "Finish",
      instructions: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac eros sit amet lorem facilisis vulputate at non dui.",
      choices:
        new Map([
          [{ name: "Finishing Touch", tooltip: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", limit: 2, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]]
        ]),
      buttons:
        [{ name: "Next", type: ButtonType.Next }, { name: "Back", type: ButtonType.Back }]
    }],
    [Category.Publish, {
      name: "Publish",
      instructions: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac eros sit amet lorem facilisis vulputate at non dui.",
      choices: new Map(),
      buttons:
        [{ name: "Publish Recipe", type: ButtonType.Finish }, { name: "Back", type: ButtonType.Back }]
    }],
  ]);

  readonly firstCategory = Category.Setup;
  readonly lastCategory = Category.Publish;

  protected layers: Map<number, ChoiceList> = new Map();

  protected selectedCategory: Category = Category.Setup;
  protected selectedType: RecipeType = RecipeType.Cake;
  protected selectedLayer: number = 0;
  protected selectedChoice?: IChoiceType;

  protected recipeName?: string;
  protected recipeNameError?: string;
  protected recipeDescription?: string;
  protected recipeInstructions?: string;
  protected publicRecipe: boolean = false;

  protected user: IUser = UserService.DefaultUser;

  protected get requiredPoints(): number {
    return Recipe.PointsRequiredForRecipe * (this.publicRecipe ? 9.5 : 1);
  }

  protected get hasEnoughPoints(): boolean {
    return (this.requiredPoints == 0 || (this.user.points != undefined && this.user.points >= this.requiredPoints));
  }

  protected get numLayers() {
    return Recipe.numLayers(this.categories);
  }

  protected get theme() {
    return Recipe.getTheme(this.categories);
  }

  protected get type() {
    return this.customTypes.get(this.selectedType);
  }

  protected get currentCategory() {
    return this.categories.get(this.selectedCategory)!;
  }

  protected get currentLayer() {
    return this.layers.get(this.selectedLayer);
  }

  protected get currentChoice() {
    const choiceList = this.layers.get(this.selectedLayer);
    return choiceList && this.selectedChoice
      ? choiceList.get(this.selectedChoice)
      : undefined;
  }

  protected getLastChoice(choiceList: ChoiceList) {
    return [...choiceList.keys()].at(-1);
  }

  protected getSelection = ItemChoiceList.GetSelection;

  constructor(
    private router: Router,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef) { }

  protected ngOnInit() {
    this.userService.user$.subscribe(data => {
      this.user = data;
      this.cdr.detectChanges();
    });
  }

  protected initLayers() {
    this.layers.clear();

    for (let i: number = 1; i <= this.numLayers; i++) {
      this.layers.set(i, structuredClone(Recipe.LayerChoices));
    }

    this.onSelectLayer(1);

    for (let [key, value] of this.categories) {
      if (key != Category.Setup) {
        for (let [type, choices] of value.choices) {
          type.error = undefined;
          ItemChoiceList.Reset(choices);
        }

        value.skipNonSelection = true;
      }
    }

    this.recipeName = undefined;
    this.recipeNameError = undefined;
    this.recipeDescription = undefined;
  }

  protected onSelectCategory(category: Category) {
    this.selectedCategory = category;
  }

  protected onSelectLayer(layer: number) {
    this.selectedLayer = layer;

    const choiceList = this.layers.get(this.selectedLayer);
    if (choiceList) {
      // Set selected choice to 1st
      this.selectedChoice = [...choiceList.keys()].at(0);
    }
  }

  protected onSelectChoice(choiceType: IChoiceType) {
    this.selectedChoice = choiceType;
  }

  protected onCustomTypeChange(type: RecipeType) {
    this.selectedType = type;
  }

  protected hasError(category: Category, skipNonSelection?: boolean, choice?: IChoiceType, layer?: number): boolean {
    if (category == Category.Layering) {
      if (choice != undefined || layer != undefined) {
        const choiceList = layer != undefined ? this.layers.get(layer) : this.currentLayer;
        if (choiceList) {
          if (choice != undefined) {
            const choiceIndex = [...choiceList.keys()].findIndex(value => (value == choice));
            const choices = [...choiceList.values()].at(choiceIndex);
            if (choices && ItemChoiceList.HasError(choice, choices, skipNonSelection)) {
              return true;
            }
          }
          else {
            for (let [key, value] of choiceList) {
              if (ItemChoiceList.HasError(key, value, skipNonSelection)) {
                return true;
              }
            }
          }

          return false;
        }
      }

      for (let [layer, choiceList] of this.layers) {
        for (let [key, value] of choiceList) {
          if (ItemChoiceList.HasError(key, value, skipNonSelection)) {
            return true;
          }
        }
      }

      return false;
    }

    const data = this.categories.get(category);
    if (data != undefined) {
      for (let [key, value] of data.choices) {
        if (ItemChoiceList.HasError(key, value, skipNonSelection)) {
          return true;
        }
      }
    }

    if (category == Category.Publish) {
      if (this.recipeNameError) {
        return true;
      }

      if (this.recipeName == undefined && skipNonSelection) {
        return false;
      }

      return (this.recipeName == undefined || this.recipeName.length < 4);
    }

    return false;
  }

  protected showErrors(category: Category, choice?: IChoiceType) {
    if (category == Category.Layering) {
      if (choice) {
        const choiceList = this.layers.get(this.selectedLayer);
        if (choiceList) {
          const choiceIndex = [...choiceList.keys()].findIndex(value => (value == choice));
          const choices = [...choiceList.values()].at(choiceIndex);
          if (choices) {
            ItemChoiceList.ShowError(choice, choices);
          }
        }
      }
      else {
        for (let [layer, choiceList] of this.layers) {
          for (let [key, value] of choiceList) {
            ItemChoiceList.ShowError(key, value);
          }
        }
      }
      return;
    }

    const data = this.categories.get(category);
    if (data) {
      for (let [key, value] of data.choices) {
        ItemChoiceList.ShowError(key, value);
      }
    }

    if (category == Category.Publish) {
      this.recipeNameError = this.hasError(category)
        ? "Invalid recipe name"
        : undefined;
    }
  }

  // This checks for errors in all categories except the last one
  protected hasErrors(skipNonSelection?: boolean): boolean {
    for (let [key, value] of this.categories) {
      if (key != this.lastCategory) {
        if (this.hasError(key, skipNonSelection)) {
          return true;
        }
      }
    }

    for (let [layer, choiceList] of this.layers) {
      for (let [key, value] of choiceList) {
        if (ItemChoiceList.HasError(key, value, skipNonSelection)) {
          return true;
        }
      }
    }

    return false;
  }

  protected next() {
    this.showErrors(this.selectedCategory, this.selectedChoice);

    if (this.hasError(this.selectedCategory, false, this.selectedChoice)) {
      this.snackBar.open("Please fix the errors before proceeding.", "Close", {
        duration: 2500
      });

      return;
    }

    const keysArray = Array.from(this.categories.keys());
    const currentIndex = keysArray.indexOf(this.selectedCategory);

    if (currentIndex != -1) {
      let newindex = currentIndex + 1;

      if (currentIndex == Category.Setup) {
        this.initLayers();
      }
      else if (currentIndex == Category.Layering) {
        const choiceList = this.layers.get(this.selectedLayer);
        if (choiceList) {
          const lastChoice = [...choiceList.keys()].at(-1);
          if (this.selectedChoice == lastChoice) {
            if (this.selectedLayer != this.numLayers) {
              this.onSelectLayer(++this.selectedLayer);
              return;
            }
            else {
              // Show all errors
              if (this.hasError(currentIndex, false)) {
                this.showErrors(currentIndex);

                let category = this.categories.get(currentIndex);
                if (category) {
                  category.skipNonSelection = false;
                }

                this.snackBar.open("There are errors in Layering, please fix them before continuing.", "Close", {
                  duration: 3000
                });
                return;
              }
            }
          } else {
            const currentChoiceIndex = [...choiceList.keys()].findIndex(value => (value == this.selectedChoice));
            const nextChoice = [...choiceList.keys()].at(currentChoiceIndex + 1);
            if (nextChoice) {
              this.onSelectChoice(nextChoice);
              return;
            }
          }
        }
      }
      else if (currentIndex == this.lastCategory) {
        return this.finish();
      }

      if (newindex == this.lastCategory) {
        if (this.hasErrors(false)) {
          for (let [key, value] of this.categories) {
            if (key != this.lastCategory) {
              this.showErrors(key);
            }
          }

          this.snackBar.open("Make sure there are no errors in previous steps in order to proceed.", "Close", {
            duration: 3000
          });
          return;
        }
      }

      this.selectedCategory = keysArray[newindex];
    }
  }

  private finish() {
    this.snackBar.open("Finished.", "Close", {
      duration: 3000
    });

    let recipe: IRecipe = {
      name: this.recipeName!,
      desc: this.recipeDescription,
      type: this.selectedType,
      value: 25,
      recipe: this.categories,
      buyHistory: new Map(),
      isPrivate: this.publicRecipe,
      date: Date.now()
    };

    this.userService.addRecipe(recipe);

    this.router.navigate(['/recipe-book']);
  }

  protected back() {
    const keysArray = Array.from(this.categories.keys());
    const currentIndex = keysArray.indexOf(this.selectedCategory);

    if (currentIndex == Category.Layering) {
      const choiceList = this.layers.get(this.selectedLayer);
      if (choiceList) {
        const firstChoice = [...choiceList.keys()].at(0);
        if (this.selectedChoice == firstChoice) {
          if (this.selectedLayer != 1) {
            this.onSelectLayer(--this.selectedLayer);
            const lastChoice = [...choiceList.keys()].at(-1);
            if (lastChoice) {
              this.onSelectChoice(lastChoice);
            }
            return;
          }
        } else {
          const currentChoiceIndex = [...choiceList.keys()].findIndex(value => (value == this.selectedChoice));
          const previousChoice = [...choiceList.keys()].at(currentChoiceIndex - 1);
          if (previousChoice) {
            this.onSelectChoice(previousChoice);
            return;
          }
        }
      }
    }

    let newindex = currentIndex - 1;
    if (newindex > -1) {
      this.selectedCategory = keysArray[newindex];
    }
  }

  static numLayers(recipeGroup: RecipeGroup) {
    let num = 0;

    const settings = recipeGroup.get(Category.Setup);
    if (settings) {
      const choice = ItemChoiceList.GetChoice(settings.choices, "Layers");
      if (choice) {
        num = Number(choice.extraid);
      }
    }

    return num;
  }

  static getTheme(recipeGroup: RecipeGroup) {
    const settings = recipeGroup.get(Category.Setup);
    if (settings) {
      const choice = ItemChoiceList.GetChoice(settings.choices, "Theme");
      if (choice) {
        return choice.name;
      }
    }

    return null;
  }

  static getPoints(recipe: IRecipe) {
    return recipe.buyHistory.size * Recipe.PointsPerRecipe;
  }
}
