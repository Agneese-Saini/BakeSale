import { Routes } from '@angular/router'
import { Checkout } from './checkout/checkout';
import { Content } from './content/content';
import { CategoryContent } from './content/category-content';
import { Recipe } from './recipe/recipe';
import { OrderHistory } from './user/order-history';
import { ViewReceipt } from './user/view-receipt';
import { RecipeBook } from './user/recipe-book';
import { ItemPage } from './content/itemPage';

export const routes: Routes = [
    {
        path: '',
        component: Content
    },
    {
        path: 'category',
        component: CategoryContent
    },
    {
        path: 'checkout',
        component: Checkout
    },
    {
        path: 'create',
        component: Recipe
    },
    {
        path: 'order-history',
        component: OrderHistory
    },
    {
        path: 'view-receipt',
        component: ViewReceipt
    },
    {
        path: 'recipe-book',
        component: RecipeBook
    },
    {
        path: 'item',
        component: ItemPage
    },
    // Add a wildcard route for unknown URLs
    {
        path: '**',
        redirectTo: ''
    }
];
