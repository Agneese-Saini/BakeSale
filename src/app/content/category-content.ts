import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLinkActive, RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { Category, CategoryService, ICategory } from '../header/category';
import { CategoryItemsList } from './itemList';

@Component({
    selector: 'category-content',
    imports: [FormsModule, FontAwesomeModule, RouterModule, CategoryItemsList],
    templateUrl: "category-content.html"
})
export class CategoryContent {

    protected category: ICategory = Category.DefaultCategory;
    protected parent: ICategory = Category.DefaultCategory;

    protected currentPage?: string;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private service: CategoryService) { }

    protected ngOnInit() {
        this.service.categories$.subscribe(data => {
            const name = this.route.snapshot.paramMap.get('name');
            if (name) {
                let find = Category.findCategory(name, data);
                if (find) {
                    this.category = find;

                    find = Category.findParent(this.category, data);
                    if (find) {
                        this.parent = find;
                    }
                }
            }

            if (this.category == Category.DefaultCategory) {
                this.router.navigate(['/']);
            }
        });
    }

    protected onSelectPage(page?: string) {
        this.currentPage = page;
    }
};