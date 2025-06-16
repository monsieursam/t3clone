import { db } from '@repo/database';
import { schema } from '@repo/database';
import type { WebhookEvent } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';

// This is the Clerk webhook handler that syncs user data with our database

const { users } = schema;

export async function POST(req: Request) {
  // Verify the webhook signature
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no svix headers, return 400
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json('Missing svix headers', { status: 400 });
  }



  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json('Missing webhook secret', { status: 500 });
  }

  // Create a new Svix instance and verify the webhook
  const wh = new Webhook(webhookSecret);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json('Error verifying webhook', { status: 400 });
  }

  // Handle the webhook event
  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, image_url, first_name, last_name } = evt.data;

    // Get the primary email
    const primaryEmail = email_addresses?.[0]?.email_address;

    if (!primaryEmail) {
      return new Response('No email found for user', { status: 400 });
    }

    try {
      // Check if user already exists
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (existingUser.length > 0) {
        // Update existing user
        await db.update(users)
          .set({
            email: primaryEmail,
            first_name: first_name,
            last_name: last_name,
            image_url: image_url,
          })
          .where(eq(users.id, id));
      } else {
        // Create new user
        await db.insert(users).values({
          id: id,
          email: primaryEmail,
          first_name: first_name,
          last_name: last_name,
          image_url: image_url,
        });
      }

      return NextResponse.json('User synchronized successfully', { status: 200 });
    } catch (error) {
      console.error('Error syncing user to database:', error);
      return NextResponse.json('Error syncing user to database', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    // Ensure id is not undefined before proceeding
    if (!id) {
      console.error('No user ID provided for deletion');
      return NextResponse.json('No user ID provided', { status: 400 });
    }

    try {
      // Delete the user from our database
      await db.delete(users).where(eq(users.id, id.toString()));
      return NextResponse.json('User deleted successfully', { status: 200 });
    } catch (error) {
      console.error('Error deleting user from database:', error);
      return NextResponse.json('Error deleting user from database', { status: 500 });
    }
  }

  // Return a 200 response for any other event types
  return NextResponse.json('Webhook received', { status: 200 });
}
