import { ChangeDetectorRef, Component } from '@angular/core';
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { ChoiceList, ItemChoiceCatalog, ItemChoiceList } from "../content/itemChoice";
import { KeyValuePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { IUser, UserService } from '../user/user';

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
  Settings,
  Layer1,
  Layer2,
  Layer3,
  Finish
}

export interface IRecipeGroup {
  name: string,
  choices: ChoiceList,
  buttons: { name: string, type: ButtonType }[],
  instructions?: string,
  hidden?: boolean
}
export type RecipeGroup = Map<Category, IRecipeGroup>;

export interface IRecipe {
  name: string,
  type: RecipeType,
  value: number,
  recipe: Map<Category, IRecipeGroup>,
  buyHistory: Map<IUser, number>,
  pointsPerBuy: number,
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
  
  protected pointsRequiredForRecipe = Recipe.PointsRequiredForRecipe;

  protected get hasEnoughPoints(): boolean {
    return (this.pointsRequiredForRecipe == 0 || (this.user.points != undefined && this.user.points >= this.pointsRequiredForRecipe));
  }

  static readonly CustomTypes: Map<RecipeType, { label: string, icon: string }> = new Map([
    [RecipeType.Cake, {
      label: "Cake",
      icon: "circle-dot"
    }],
    [RecipeType.CheeseCake, {
      label: "Cheesecake",
      icon: "cake-candles"
    }]
  ]);

  private recipe: RecipeGroup = new Map([
    [Category.Settings, {
      name: "Cake Setup",
      instructions: "To start building, choose a theme for your cake. This will help us in designing and layering your cake accordingly.\n\
        You will have the option to select how many layers of cake you want and style each layer in the next steps.",
      choices:
        new Map([
          [{ name: "Theme", limit: 1, required: true }, [{ name: "Birthday" }, { name: "Office Party" }, { name: "Drunk Fest" }, { name: "Cartoon" }, { name: "Christmas" }]],
          [{ name: "Layers", limit: 1, required: true }, [{ name: "1 Layer", extraid: 1 }, { name: "2 Layers", extraid: 2 }, { name: "3 Layers", extraid: 3 }]]
        ]),
      buttons:
        [{ name: "Next", type: ButtonType.Next }]
    }],
    [Category.Layer1, {
      name: "Base Bun",
      instructions: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac eros sit amet lorem facilisis vulputate at non dui.",
      choices:
        new Map([
          [{ name: "Bun Shape", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]],
          [{ name: "Bun Flavor", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]],
          [{ name: "Cake Filling", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]],
          [{ name: "Cake Frosting", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]],
          [{ name: "Addons", limit: 5, required: false }, [{ name: "Option 1" }, { name: "Option 2" }]],
          [{ name: "Finish", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]]
        ]),
      buttons:
        [{ name: "Next", type: ButtonType.Next }, { name: "Back", type: ButtonType.Back }]
    }],
    [Category.Layer2, {
      name: "Middle Bun",
      instructions: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac eros sit amet lorem facilisis vulputate at non dui.",
      choices:
        new Map([
          [{ name: "Bun Shape", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]],
          [{ name: "Bun Flavor", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]],
          [{ name: "Cake Filling", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]],
          [{ name: "Cake Frosting", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]],
          [{ name: "Addons", limit: 5, required: false }, [{ name: "Option 1" }, { name: "Option 2" }]],
          [{ name: "Finish", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]]
        ]),
      buttons:
        [{ name: "Next", type: ButtonType.Next }, { name: "Back", type: ButtonType.Back }]
    }],
    [Category.Layer3, {
      name: "Top Bun",
      instructions: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac eros sit amet lorem facilisis vulputate at non dui.",
      choices:
        new Map([
          [{ name: "Bun Shape", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]],
          [{ name: "Bun Flavor", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]],
          [{ name: "Cake Filling", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]],
          [{ name: "Cake Frosting", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]],
          [{ name: "Addons", limit: 5, required: false }, [{ name: "Option 1" }, { name: "Option 2" }]],
          [{ name: "Finish", limit: 1, required: true }, [{ name: "Option 1" }, { name: "Option 2" }]]
        ]),
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
        [{ name: "Publish Recipe", type: ButtonType.Finish }, { name: "Back", type: ButtonType.Back }]
    }]
  ]);

  readonly buttonType = ButtonType;
  readonly category = Category;
  readonly customTypes = Recipe.CustomTypes;

  protected readonly firstCategory = Category.Settings;
  protected readonly lastCategory = Category.Finish;

  protected selectedCategory: Category = this.firstCategory;
  protected selectedType: RecipeType = RecipeType.Cake;

  protected recipeName?: string;
  protected recipeNameError?: string;
  protected recipeDescription?: string;

  protected user: IUser = UserService.DefaultUser;

  protected get numLayers() {
    return Recipe.numLayers(this.recipe);
  }

  protected get theme() {
    return Recipe.getTheme(this.recipe);
  }

  protected get categories() {
    this.recipe.get(Category.Layer1)!.hidden = false;
    this.recipe.get(Category.Layer2)!.hidden = true;
    this.recipe.get(Category.Layer3)!.hidden = true;

    if (this.numLayers > 1) {
      this.recipe.get(Category.Layer3)!.hidden = false;
    }

    if (this.numLayers > 2) {
      this.recipe.get(Category.Layer2)!.hidden = false;
    }

    return this.recipe;
  }

  protected get currentCategory() {
    return this.categories.get(this.selectedCategory);
  }

  protected get layers(): { key: Category, value?: IRecipeGroup }[] {
    return [
      { key: Category.Layer1, value: this.recipe.get(Category.Layer1) },
      { key: Category.Layer2, value: this.recipe.get(Category.Layer2) },
      { key: Category.Layer3, value: this.recipe.get(Category.Layer3) }
    ];
  }

  protected layerName(key: Category) {
    switch (this.numLayers) {
      case 1: {
        return "1st";
      }

      case 2: {
        if (key == Category.Layer1) {
          return "1st";
        } else if (key == Category.Layer3) {
          return "2nd";
        }
        break;
      }

      case 3: {
        if (key == Category.Layer1) {
          return "1st";
        } else if (key == Category.Layer2) {
          return "2nd";
        } else if (key == Category.Layer3) {
          return "3rd";
        }
        break;
      }
    }

    return "\0";
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

  protected onSelectCategory(category: Category) {
    this.selectedCategory = category;
  }

  protected onCustomTypeChange(type: RecipeType) {
    this.selectedType = type;
  }

  protected hasChoice(category: Category): boolean {
    const data = this.recipe.get(category);
    if (data) {
      for (let [key, value] of data.choices) {
        if (ItemChoiceList.NumSelection(value) > 0) {
          return true;
        }
      }
    }

    return false;
  }

  protected hasError(category: Category, skipNonSelection?: boolean): boolean {
    const data = this.recipe.get(category);

    if (data) {
      for (let [key, value] of data.choices) {
        if (ItemChoiceList.HasError(key, value, skipNonSelection)) {
          return true;
        }
      }
    }

    return false;
  }

  protected hasErrors(skipNonSelection?: boolean): boolean {
    for (let [key, value] of this.categories) {
      if (key != this.lastCategory && !value.hidden) {
        if (this.hasError(key, skipNonSelection)) {
          return true;
        }
      }
    }

    return false;
  }

  protected showErrors(category: Category) {
    const data = this.recipe.get(category);
    if (data) {
      for (let [key, value] of data.choices) {
        ItemChoiceList.ShowError(key, value);
      }

      if (category == this.lastCategory) {
        this.recipeNameError = !(this.recipeName && this.recipeName.length > 4)
          ? "Invalid recipe name"
          : undefined;
      }
    }
  }

  protected next() {
    this.showErrors(this.selectedCategory);

    if (!this.hasError(this.selectedCategory, false)) {
      const keysArray = Array.from(this.recipe.keys());
      const currentIndex = keysArray.indexOf(this.selectedCategory);

      if (currentIndex != -1) {
        let newindex = currentIndex + 1;

        if (newindex == keysArray.length) {
          if (this.recipeNameError) {
            this.snackBar.open("Please provide a valid name for your recipe.", "Close", {
              duration: 2500
            });
            return;
          }

          return this.finish();
        }

        while (newindex < keysArray.length) {
          const recipe = this.recipe.get(keysArray[newindex]);
          if (recipe && !recipe.hidden) {
            if (keysArray[newindex] == this.lastCategory) {
              if (this.hasErrors()) {
                for (let [key, value] of this.categories) {
                  if (key != this.lastCategory && !value.hidden) {
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
            break;
          }

          newindex += 1;
        }
      }
    }
    else {
      this.snackBar.open("Please fix the errors before proceeding.", "Close", {
        duration: 2500
      });
    }
  }

  protected finish() {
    this.snackBar.open("Finished.", "Close", {
      duration: 3000
    });

    let recipe: IRecipe = {
      name: this.recipeName!,
      desc: this.recipeDescription,
      type: this.selectedType,
      value: 25,
      recipe: this.recipe,
      buyHistory: new Map(),
      pointsPerBuy: 15,
      date: Date.now()
    };

    this.userService.addRecipe(recipe);

    this.router.navigate(['/recipe-book']);
  }

  protected back() {
    const keysArray = Array.from(this.recipe.keys());
    const currentIndex = keysArray.indexOf(this.selectedCategory);

    if (currentIndex != -1) {
      let newindex = currentIndex - 1;
      while (newindex > -1) {
        const recipe = this.recipe.get(keysArray[newindex]);
        if (recipe && !recipe.hidden) {
          this.selectedCategory = keysArray[newindex];
          break;
        }

        newindex -= 1;
      }
    }
  }

  static numLayers(recipeGroup: RecipeGroup) {
    let num = 0;

    const settings = recipeGroup.get(Category.Settings);
    if (settings) {
      const choice = ItemChoiceList.GetChoice(settings.choices, "Layers");
      if (choice) {
        num = Number(choice.extraid);
      }
    }

    return num;
  }

  static getTheme(recipeGroup: RecipeGroup) {
    const settings = recipeGroup.get(Category.Settings);
    if (settings) {
      const choice = ItemChoiceList.GetChoice(settings.choices, "Theme");
      if (choice) {
        return choice.name;
      }
    }

    return null;
  }

  static getPoints(recipe: IRecipe) {
    return recipe.buyHistory.size * recipe.pointsPerBuy;
  }
}
