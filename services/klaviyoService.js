import axios from 'axios';

const REVISION = '2024-10-15';

class KlaviyoService {
  constructor(apiKey) {
    if (!apiKey) throw new Error('Klaviyo API key is required');
    this.client = axios.create({
      baseURL: 'https://a.klaviyo.com/api',
      headers: {
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
        'revision': REVISION,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  // ==================== Lists ====================

  async getLists() {
    const res = await this.client.get('/lists/', { params: { 'page[size]': 100 } });
    return res.data.data || [];
  }

  async getListById(listId) {
    const res = await this.client.get(`/lists/${listId}/`);
    return res.data.data;
  }

  // ==================== Subscriptions ====================

  // Subscribes profile to a list with proper email marketing consent.
  // Creates the profile if it doesn't exist yet.
  async subscribeToList(email, listId, options = {}) {
    const attrs = {
      email,
      subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } },
    };
    if (options.firstName) attrs.first_name = options.firstName;
    if (options.lastName) attrs.last_name = options.lastName;
    if (options.phoneNumber) attrs.phone_number = options.phoneNumber;
    if (options.properties) attrs.properties = options.properties;

    const res = await this.client.post('/profile-subscription-bulk-create-jobs/', {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          profiles: { data: [{ type: 'profile', attributes: attrs }] },
        },
        relationships: { list: { data: { type: 'list', id: listId } } },
      },
    });

    return { success: true, message: 'Subscribed successfully', job: res.data.data };
  }

  async unsubscribeFromList(email, listId) {
    const profile = await this.getProfileByEmail(email);
    if (!profile) throw new Error('Profile not found');

    await this.client.delete(`/lists/${listId}/relationships/profiles/`, {
      data: { data: [{ type: 'profile', id: profile.id }] },
    });

    return { success: true, message: 'Removed from list' };
  }

  // ==================== Profiles ====================

  async getProfileByEmail(email) {
    const res = await this.client.get('/profiles/', {
      params: {
        filter: `equals(email,"${email}")`,
        'fields[profile]': 'email,first_name,last_name,phone_number,properties,created,updated',
      },
    });
    const profiles = res.data.data || [];
    return profiles.length > 0 ? profiles[0] : null;
  }

  // Creates a new profile or updates the existing one if email already exists.
  async createOrUpdateProfile(email, attributes = {}) {
    try {
      const res = await this.client.post('/profiles/', {
        data: { type: 'profile', attributes: { email, ...attributes } },
      });
      return { success: true, created: true, profile: res.data.data };
    } catch (err) {
      if (err.response?.status === 409) {
        const profileId = err.response.data?.errors?.[0]?.meta?.duplicate_profile_id;
        if (!profileId) throw new Error('Profile already exists but ID could not be retrieved');
        const patch = await this.client.patch(`/profiles/${profileId}/`, {
          data: { type: 'profile', id: profileId, attributes },
        });
        return { success: true, created: false, profile: patch.data.data };
      }
      throw err;
    }
  }

  async updateProfile(email, properties = {}) {
    return this.createOrUpdateProfile(email, { properties });
  }

  // ==================== Events ====================

  async trackEvent(email, eventName, properties = {}, value = null) {
    const attributes = {
      metric: { data: { type: 'metric', attributes: { name: eventName } } },
      profile: { data: { type: 'profile', attributes: { email } } },
      properties,
      time: new Date().toISOString(),
    };
    if (value !== null) attributes.value = value;

    const res = await this.client.post('/events/', {
      data: { type: 'event', attributes },
    });

    return { success: true, message: 'Event tracked', event: res.data.data };
  }

  // ==================== Flows ====================

  async getFlows() {
    const res = await this.client.get('/flows/', { params: { 'page[size]': 50 } });
    return res.data.data || [];
  }

  // Klaviyo does not support direct flow triggering via REST.
  // Flows are triggered by list membership or metric events.
  // This method tracks the named event — set up a metric-triggered flow in Klaviyo
  // that listens for this event name.
  async triggerFlowViaEvent(email, eventName, properties = {}) {
    return this.trackEvent(email, eventName, properties);
  }

  // ==================== Segments ====================

  async getSegments() {
    const res = await this.client.get('/segments/', { params: { 'page[size]': 50 } });
    return res.data.data || [];
  }

  // ==================== Bulk ====================

  async bulkSubscribe(subscribers, listId) {
    const results = [];
    for (const s of subscribers) {
      results.push(await this.subscribeToList(s.email, listId, {
        firstName: s.firstName,
        lastName: s.lastName,
        phoneNumber: s.phoneNumber,
        properties: s.properties,
      }));
    }
    return results;
  }

  async bulkTrackEvents(events) {
    const results = [];
    for (const e of events) {
      results.push(await this.trackEvent(e.email, e.eventName, e.properties, e.value));
    }
    return results;
  }
}

export default KlaviyoService;
