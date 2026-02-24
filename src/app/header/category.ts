import { Component, EventEmitter, Output } from '@angular/core';
import { Injectable, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IItem } from '../content/item';

export enum Customizer {
	Recipe,
	Subscription,
	Marketplace
};

export interface ICategory {
	name: string,
	icon?: string,
	checked?: boolean,
	about?: string,
	subcats?: ICategory[],
	customizer?: Customizer,
	items?: IItem[],
	pages?: string[],
	hidden?: boolean,
	fontSize?: number
};

@Injectable({
	providedIn: 'root' // Makes the service a singleton and available throughout the app
})
export class CategoryService {

	private categoryList: ICategory[] = [
		{
			name: "Cake", icon: "cake-candles", hidden: true, subcats:
				[{ name: "Creat Your Own", fontSize: 0, customizer: Customizer.Recipe },
				{ name: "Cakes", fontSize: 2 },
				{ name: "Cheesecake", fontSize: 2 },
				{
					name: "Custom Cakes", fontSize: 2, pages:
						["Chocolate", "Fruit", "Trending", "Local"]
				},
				{ name: "Cupcakes", fontSize: 2 },
				{ name: "Pound Cake", fontSize: 2 }
				]
		},
		{
			name: "Pastry", icon: "cheese", hidden: true, subcats:
				[{ name: "Flaky Pastry", fontSize: 2 },
				{ name: "Puff Pastry", fontSize: 2 },
				{ name: "Mille-feuille", fontSize: 2 },
				{ name: "Tarts", fontSize: 2 },
				{ name: "Macarons", fontSize: 2 },
				]
		},
		{
			name: "Cookies", icon: "cookie", hidden: true, subcats:
				[{ name: "Drop Cookies", fontSize: 2 },
				{ name: "Filled Cookies", fontSize: 2 },
				{ name: "Sandwich Cookies", fontSize: 2 },
				{ name: "Protein Cookies", fontSize: 2 },
				{ name: "Biscotti", fontSize: 2 },
				{ name: "Brownies", fontSize: 2 }
				]
		},
		{
			name: "Bread", icon: "bread-slice", hidden: true, subcats:
				[{ name: "Daily Bread", fontSize: 0, customizer: Customizer.Subscription },
				{ name: "Sandwich Loaves", fontSize: 2 },
				{ name: "Buns", fontSize: 2 },
				{ name: "Brioche", fontSize: 2 },
				{ name: "French", fontSize: 2 },
				{ name: "Mediterranean", fontSize: 2 },
				{ name: "Asian", fontSize: 2 },
				{ name: "Doughs", fontSize: 2 }
				]
		},
		{
			name: "Canna Bakery", icon: "cannabis", hidden: true, subcats:
				[{ name: "Canna Pies", fontSize: 2 },
				{ name: "Canna Cookies", fontSize: 2 },
				{ name: "Canna Brownies", fontSize: 2 },
				{ name: "Canna Cupcakes", fontSize: 2 },
				{ name: "Edibles", fontSize: 2 }
				]
		},
		{
			name: "Canna Bar", icon: "blender", hidden: true, subcats:
				[{ name: "Canna Milkshakes", fontSize: 2 },
				{ name: "Canna Kombucha", fontSize: 2 },
				{ name: "Wake'n'Bake", fontSize: 2 },
				{ name: "Canna Pop", fontSize: 2 }
				]
		},
		{
			name: "Canna Butter", icon: "cow", hidden: true, subcats:
				[{ name: "Unsalted & Unflavored", fontSize: 2 },
				{ name: "Flavored Butter", fontSize: 2 }
				]
		},
		{
			name: "Marketplace", icon: "shop", hidden: true, subcats:
				[{ name: "Get Started", fontSize: 0, customizer: Customizer.Marketplace },
				{ name: "Cakes", fontSize: 2 },
				{ name: "Pastry", fontSize: 2 },
				{ name: "Cookies", fontSize: 2 },
				{ name: "Sweets", fontSize: 2 },
				{ name: "Other Bakery", fontSize: 2 }
				]
		}
	];

	private _categories = new BehaviorSubject<ICategory[]>(this.categoryList);
	public categories$ = this._categories.asObservable(); // Expose as Observable

	constructor() {
		// Setting every category to 'checked' by default
		for (let cat of this.categoryList) {
			Category.setChecked(cat, true);
		}

		this.loadCategories();
	}

	public loadCategories() {
		let category = Category.findCategory("Cakes", this.categoryList, "Cake");
		if (category) {
			Category.addItem(category, {
				name: 'Chocolate Cake',
				about: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac eros sit amet lorem facilisis vulputate at non dui. \
						Aenean tempus ligula nec suscipit venenatis. Fusce luctus ipsum diam, aliquet dictum ligula imperdiet et. \
						In lectus velit, semper ut iaculis vel, congue nec ipsum.",
				ingredients: "Flour, sugar, eggs, fat (butter/oil), liquid (milk), leavening (baking powder/soda), salt, and flavor (vanilla extract)",
				company: "BakeSale",
				image: [
					"https://tatyanaseverydayfood.com/wp-content/uploads/2022/03/The-Best-Dark-Chocolate-Cake-Recipe-3.jpg",
					"https://thescranline.com/wp-content/uploads/2025/02/VANILLA-CAKE-25-WEB-04-768x1024.jpg"
				],
				details: [
					{ header: 'Gluten Free', detail: 'Yes' },
					{ header: 'Dairy Free', detail: 'No' },
					{ header: 'Flavors', detail: 'Vanila, Candy, Butterscotch' }
				],
				price: { value: 19.99 },
				amount: 0
			});
		}

		category = Category.findCategory("Cakes", this.categoryList, "Cake");
		if (category) {
			Category.addItem(category, {
				name: 'Sprinkle Cake',
				about: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac eros sit amet lorem facilisis vulputate at non dui. \
						Aenean tempus ligula nec suscipit venenatis. Fusce luctus ipsum diam, aliquet dictum ligula imperdiet et. \
						In lectus velit, semper ut iaculis vel, congue nec ipsum. Cras ultrices eros elit, gravida euismod mi lobortis \
						vitae. Aenean volutpat vehicula orci, ut consequat enim auctor sed. Vestibulum mi erat, accumsan eget ligula vel,\
						 posuere pellentesque justo. Aenean dui orci, imperdiet vel sapien i",
				ingredients: "Flour, sugar, eggs, fat (butter/oil), liquid (milk), leavening (baking powder/soda), salt, and flavor (vanilla extract)",
				details: [
					{ header: 'Gluten Free', detail: 'Yes' },
					{ header: 'Dairy Free', detail: 'No' },
					{ header: 'Flavors', detail: 'Vanila, Candy, Butterscotch' }
				],
				company: "Gunns Bakery",
				image: ["https://thescranline.com/wp-content/uploads/2025/02/VANILLA-CAKE-25-WEB-04-768x1024.jpg"],
				price: { value: 23.50 },
				amount: 0,
				stockAmount: 1,
				notify: "Hey, you might like this one!",
			});
		}

		category = Category.findCategory("Custom Cakes", this.categoryList, "Cake");
		if (category) {
			Category.addItem(category, {
				name: 'Red Velvet',
				about: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac eros sit amet lorem facilisis vulputate at non dui. \
						Aenean tempus ligula nec suscipit venenatis. Fusce luctus ipsum diam, aliquet dictum ligula imperdiet et. \
						In lectus velit, semper ut iaculis vel, congue nec ipsum. Cras ultrices eros elit, gravida euismod mi lobortis \
						vitae. Aenean volutpat vehicula orci, ut consequat enim auctor sed. Vestibulum mi erat, accumsan eget ligula vel,\
						 posuere pellentesque justo. Aenean dui orci, imperdiet vel sapien i",
				ingredients: "Flour, sugar, eggs, fat (butter/oil), liquid (milk), leavening (baking powder/soda), salt, and flavor (vanilla extract)",
				image: [ "https://cdn.prod.website-files.com/614a379840dbad1848e598c2/679906d29abceb2bbceb0696_679905de4268ad4dc4eae460_IMG_1630.jpeg" ],
				amount: 0,
				author: "MyNameIsShady",
				details: [
					{ header: 'Gluten Free', detail: 'Yes' },
					{ header: 'Dairy Free', detail: 'No' },
					{ header: 'Flavors', detail: 'Vanila, Candy, Butterscotch' }
				],
				price: { value: 19.99 }
			});

			Category.addItem(category, {
				name: 'Pistachio Cake',
				about: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac eros sit amet lorem facilisis vulputate at non dui. \
						Aenean tempus ligula nec suscipit venenatis. Fusce luctus ipsum diam, aliquet dictum ligula imperdiet et. \
						In lectus velit, semper ut iaculis vel, congue nec ipsum. Cras ultrices eros elit, gravida euismod mi lobortis \
						vitae. Aenean volutpat vehicula orci, ut consequat enim auctor sed. Vestibulum mi erat, accumsan eget ligula vel,\
						 posuere pellentesque justo. Aenean dui orci, imperdiet vel sapien i",
				ingredients: "Flour, sugar, eggs, fat (butter/oil), liquid (milk), leavening (baking powder/soda), salt, and flavor (vanilla extract)",
				tags: ["Best Selling"],
				details: [
					{ header: 'THC', detail: '12%' },
					{ header: 'CBD', detail: '< 1%' },
					{ header: 'X Component', detail: 'less than 1g' },
					{ header: 'BullShit', detail: '100%' }
				],
				price: { value: 5, previousPrice: 15.0 },
				image: ["https://www.piesandtacos.com/wp-content/uploads/2023/06/pistachio-cake-19-683x1024.jpg"],
				amount: 0,
				author: "MyNameIsShady",
				isChef: true,
				notify: "New trending you might like!",
				choices: new Map([
					[{ name: "Side", limit: 5 }, [{ name: "Potatoes" }, { name: "Mash Potatoes" }]],
					[{ name: "Other Side", limit: 5 }, [{ name: "Potatoes" }, { name: "Mash Potatoes" }]]
				])
			});
		}
		
		category = Category.findCategory("Marketplace", this.categoryList, "Cake");
		if (category) {
			Category.addItem(category, {
				name: 'Red Velvet',
				about: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac eros sit amet lorem facilisis vulputate at non dui. \
						Aenean tempus ligula nec suscipit venenatis. Fusce luctus ipsum diam, aliquet dictum ligula imperdiet et. \
						In lectus velit, semper ut iaculis vel, congue nec ipsum. Cras ultrices eros elit, gravida euismod mi lobortis \
						vitae. Aenean volutpat vehicula orci, ut consequat enim auctor sed. Vestibulum mi erat, accumsan eget ligula vel,\
						 posuere pellentesque justo. Aenean dui orci, imperdiet vel sapien i",
				ingredients: "Flour, sugar, eggs, fat (butter/oil), liquid (milk), leavening (baking powder/soda), salt, and flavor (vanilla extract)",
				image: [ "https://cdn.prod.website-files.com/614a379840dbad1848e598c2/679906d29abceb2bbceb0696_679905de4268ad4dc4eae460_IMG_1630.jpeg" ],
				amount: 0,
				author: "MyNameIsShady",
				details: [
					{ header: 'Gluten Free', detail: 'Yes' },
					{ header: 'Dairy Free', detail: 'No' },
					{ header: 'Flavors', detail: 'Vanila, Candy, Butterscotch' }
				],
				price: { value: 19.99 }
			});
		}

		category = Category.findCategory("Canna Milkshakes", this.categoryList, "Canna Bar");
		if (category) {
			Category.addItem(category, {
				name: 'Strawberry Blast',
				tags: ["THC: 12%", "CBD: < 1%"],
				price: { value: 5, buyOneGetOne: true },
				image: ["https://www.oliviascuisine.com/wp-content/uploads/2021/06/strawberry-milkshake-recipe-720x1080.jpg"],
				amount: 0,
				details: [
					{ header: 'THC', detail: '12%' },
					{ header: 'CBD', detail: '< 1%' }
				]
			});
		}

		category = Category.findCategory("Canna Kombucha", this.categoryList, "Canna Bar");
		if (category) {
			Category.addItem(category, {
				name: 'Kombucha Tea',
				tags: ["THC: 12%", "CBD: < 1%"],
				price: { value: 5 },
				image: ["https://wellnessmama.com/wp-content/uploads/How-to-make-Kombucha-recipe-and-tutorial.jpg"],
				amount: 0,
				details: [
					{ header: 'THC', detail: '12%' },
					{ header: 'CBD', detail: '< 1%' }
				]
			});
		}

		category = Category.findCategory("Daily Bread", this.categoryList, "Bread");
		if (category) {
			Category.addItem(category, {
				name: 'Bread 1',
				tags: ["Gluten Free"],
				ingredients: "Flour, sugar, eggs, fat (butter/oil), liquid (milk), leavening (baking powder/soda), salt",
				price: { value: 4.5, previousPrice: 5.0 },
				image: ["https://thatovenfeelin.com/wp-content/uploads/2024/10/Cheesy-Texas-Toast-1.png"],
				amount: 0
			});

			Category.addItem(category, {
				name: 'Bread 2',
				ingredients: "Flour, sugar, eggs, fat (butter/oil), liquid (milk), leavening (baking powder/soda), salt",
				price: { value: 2.75, previousPrice: 3.0 },
				image: ["https://www.kingarthurbaking.com/sites/default/files/styles/featured_image/public/2019-08/jewish-rye.jpg?itok=8XgYYHcA"],
				amount: 0
			});

			Category.addItem(category, {
				name: 'Bread 3',
				ingredients: "Flour, sugar, eggs, fat (butter/oil), liquid (milk), leavening (baking powder/soda), salt",
				price: { value: 4.0, previousPrice: 5.0 },
				image: ["https://www.seasonsandsuppers.ca/wp-content/uploads/2022/09/sub-rolls-1200.jpg"],
				amount: 0
			});
		}

		this._categories.next(this.categoryList);
	}
};


@Component({
	selector: 'category',
	imports: [FormsModule, FontAwesomeModule],
	template: `
<div class="flex justify-between items-center ">
	<li class="flex-1">	
		<!--- Category --->
		<label class="w-full">
			<input type="checkbox" class="checkbox checkbox" 
				[(ngModel)]="value.checked" 
				[indeterminate]="isPartiallyChecked" 
				(change)="onChange()" />
			<a class="">{{ value.name }}</a>
		</label>
	</li>

	<!--- Sub categories dropdown --->
	@if (value.subcats) {
	<div class="dropdown dropdown-bottom">
		<div tabindex="0" role="button" class="btn btn-circle btn-ghost text-xl label">
			<fa-icon icon="angle-down"></fa-icon>
		</div>

		<ul tabindex="0" class="dropdown-content menu bg-base-300 rounded-box z-1 w-52 p-2 shadow">
			@for (sub of value.subcats; track $index) {
			<li>
				<label class="w-full">
					<input type="checkbox" class="checkbox checkbox-sm" 
						[(ngModel)]="sub.checked"
						(change)="onChange($index)" 
					/>
					<a>{{ sub.name }}</a>
				</label>
			</li>
			}
		</ul>
	</div>
}
</div>
`
})
export class Category {

	static readonly DefaultCategory: ICategory = {
		name: "No Name",
		checked: false
	};

	@Input()
	public value: ICategory = Category.DefaultCategory;

	@Output()
	public change = new EventEmitter<void>();

	protected get isPartiallyChecked() {
		return Category.isPartiallyChecked(this.value);
	}

	protected onChange(index?: number) {
		const totalItems = this.value.subcats
			? this.value.subcats!.length
			: 0;

		if (index == undefined || (!totalItems && index == 0)) {
			Category.setChecked(this.value, this.value.checked!);
		}
		else if (totalItems && (index >= 0 && index < totalItems)) {
			Category.setChecked(this.value.subcats![index], this.value.subcats![index].checked!);

			// Update parent, sets to TRUE if all subcats are checked.
			this.value.checked = this.value.subcats!.every(sub => sub.checked);
		}

		// Fire event
		this.change.emit();
	}

	static setChecked(category: ICategory, checked: boolean) {
		if (!category) return;

		if (category.subcats) {
			for (let sub of category.subcats) {
				// fail safe
				if (sub == category) continue;

				// We will skip partially checked for completely TRUE for personal styling
				if (checked && Category.isPartiallyChecked(sub)) continue;

				Category.setChecked(sub, checked);
			}
		}

		category.checked = checked;
	}

	static isPartiallyChecked(category: ICategory) {
		if (category.subcats && !category.checked) {
			let checkedCount = 0;
			for (let sub of category.subcats!) {
				if (sub.checked) {
					++checkedCount;
				}
			}

			return checkedCount > 0 && checkedCount != category.subcats.length;
		}

		return false;
	}

	static isActive(category: ICategory): boolean {
		if (category.items && category.items.length > 0) {
			for (const item of category.items) {
				if (item.notify != undefined) {
					return true;
				}
			}
		}

		if (category.subcats && category.subcats.length > 0) {
			for (const sub of category.subcats) {
				const ret = Category.isActive(sub);
				if (ret) {
					return true;
				}
			}
		}

		return false;
	}

	static findParent(category: ICategory, categories: ICategory[], parent?: ICategory): ICategory | undefined {
		for (const cat of categories) {
			if (cat == category) {
				return parent;
			}

			if (cat.subcats && cat.subcats.length > 0) {
				const ret = this.findParent(category, cat.subcats, cat);
				if (ret != undefined) {
					return ret;
				}
			}
		}
		return undefined;
	}

	static findCategory(name: string, categories: ICategory[], parent?: string): ICategory | undefined {
		const lowerName = name.toLowerCase();
		const parentName = parent ? parent.toLowerCase() : null;

		for (const cat of categories) {
			const catName = cat.name.toLowerCase();

			if (parentName != null) {
				if (parentName == catName) {
					if (cat.subcats && cat.subcats.length > 0) {
						for (const sub of cat.subcats) {
							if (sub.name.toLowerCase() == lowerName) {
								return sub;
							}
						}
					}
					return undefined;
				}
			}
			else if (catName == lowerName) {
				return cat;
			}

			if (cat.subcats && cat.subcats.length > 0) {
				const ret = this.findCategory(name, cat.subcats, parent);
				if (ret != undefined) {
					return ret;
				}
			}
		}
		return undefined;
	}

	static findItem(name: string, category: ICategory): IItem | undefined {
		if (category.items) {
			for (let item of category.items) {
				if (item.name == name) {
					return item;
				}
			}
		}

		if (category.subcats) {
			for (let subcat of category.subcats) {
				const ret = Category.findItem(name, subcat);
				if (ret != undefined) {
					return ret;
				}
			}
		}

		return undefined;
	}

	static addItem(category: ICategory, item: IItem) {
		if (!category.items) {
			category.items = [];
		}

		item.parent = category.name;
		item.likes = 0;
		item.dislikes = 0;
		item.buys = 0;
		item.amount = 0;
		item.id = undefined;

		category.items.push(item);
	}
};


@Component({
	selector: 'category-list',
	imports: [FormsModule, FontAwesomeModule, Category],
	template: `
<category [value]="selectAll" (change)="onSelectAll()">
</category>
@for (cat of categories; track $index) {
<category [value]="cat" (change)="onSelectCategory(cat)" >
</category>
}
`
})
export class CategoryList {

	protected selectAll: ICategory = {
		name: "Select All"
	};

	protected categories: ICategory[] = [];

	constructor(
		private service: CategoryService) { }

	protected ngOnInit() {
		this.service.categories$.subscribe(data => {
			this.categories = data;

			this.selectAll.checked = this.categories.every(value => (value.checked || Category.isPartiallyChecked(value)));
		});
	}

	protected onSelectAll() {
		if (this.selectAll.checked) {
			this.categories.forEach(value => (Category.setChecked(value, true)));
		}
		else {
			this.categories.forEach(value => (Category.setChecked(value, false)));
		}
	}

	protected onSelectCategory(category: ICategory) {
		this.selectAll.checked = this.categories.every(value => (value.checked || Category.isPartiallyChecked(value)));
	}
};
