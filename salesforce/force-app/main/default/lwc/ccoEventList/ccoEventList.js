import { LightningElement, wire, track } from 'lwc';
import getUpcomingEvents from '@salesforce/apex/EventController.getUpcomingEvents';

const DATE_FORMAT = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };

export default class CcoEventList extends LightningElement {
    @track events = [];
    isLoading = true;
    hasError = false;

    @wire(getUpcomingEvents)
    wiredEvents({ data, error }) {
        this.isLoading = false;
        if (data) {
            this.events = data.map(evt => ({
                ...evt,
                formattedDate: evt.Event_Date__c
                    ? new Date(evt.Event_Date__c).toLocaleDateString('en-US', DATE_FORMAT)
                    : 'Date TBD',
            }));
            this.hasError = false;
        } else if (error) {
            console.error('ccoEventList wire error:', error);
            this.hasError = true;
        }
    }

    get hasEvents() {
        return this.events && this.events.length > 0;
    }
}
