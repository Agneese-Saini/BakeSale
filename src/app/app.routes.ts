import { Routes } from '@angular/router'
import { Checkout } from './checkout/checkout';
import { Content } from './content/content';
import { CategoryContent } from './content/category-content';
import { Recipe } from './custom/recipe';
import { OrderHistory } from './user/order-history';
import { ViewReceipt } from './user/view-receipt';
import { RecipeBook } from './user/recipe-book';
import { ItemPage } from './content/itemPage';
import { Subscribe } from './custom/subscribe';
import { Subscriptions } from './user/subscriptions';
import { Home } from './home/home';

export const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'content',
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
        path: 'subscribe',
        component: Subscribe
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
        path: 'subscriptions',
        component: Subscriptions
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
