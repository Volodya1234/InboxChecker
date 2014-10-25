var pollInterval = 2;
var filters =
{
	url:
	[
		{
			schemes: [ 'https' ],
			hostEquals: 'inbox.google.com'
		}
	]
};

function updateIcon( count )
{
	if( count )
	{
		chrome.browserAction.setIcon( { path: 'icon_logged_in.png' } );
		chrome.browserAction.setBadgeBackgroundColor( { color: [ 66, 133, 244, 255 ] } );
		chrome.browserAction.setBadgeText( { text: count != '0' ? count : '' } );
	}
	else
	{
		chrome.browserAction.setIcon( { path: 'icon_not_logged_in.png' } );
		chrome.browserAction.setBadgeBackgroundColor( { color: [ 137, 137, 132, 230 ] } );
		chrome.browserAction.setBadgeText( { text: '?' } );
	}
}

function startRequest()
{
	var xhr = new XMLHttpRequest();
	
	try
	{
		xhr.onreadystatechange = function()
		{
			if( xhr.readyState !== 4 )
			{
				return;
			}
			
			if( xhr.responseXML )
			{
				var xmlDoc = xhr.responseXML;
				var fullCountSet = xmlDoc.evaluate( '/gmail:feed/gmail:fullcount', xmlDoc, gmailNSResolver, XPathResult.ANY_TYPE, null );
				var fullCountNode = fullCountSet.iterateNext();
				
				if( fullCountNode )
				{
					updateIcon( fullCountNode.textContent );
					
					return;
				}
			}
			
			updateIcon();
		};
		
		xhr.open( 'GET', 'https://mail.google.com/mail/feed/atom', true );
		xhr.ontimeout = function() { updateIcon(); };
		xhr.onerror = function() { updateIcon(); };
		xhr.timeout = 8 * 1000; // 8 seconds
		xhr.send( null );
	}
	catch( e )
	{
		updateIcon();
	}
}

function gmailNSResolver( prefix )
{
	if( prefix === 'gmail' )
	{
		return 'http://purl.org/atom/ns#';
	}
}

function openInbox()
{
	chrome.tabs.create( { url: 'https://inbox.google.com/' } );
}

// TODO: Inbox doesn't update url when you open/close an email, so need to figure out a better way
chrome.webNavigation.onDOMContentLoaded.addListener( startRequest, filters );
chrome.webNavigation.onReferenceFragmentUpdated.addListener( startRequest, filters );

chrome.browserAction.onClicked.addListener( openInbox );

startRequest();

chrome.alarms.onAlarm.addListener( startRequest );
chrome.alarms.create( 'InboxPoll', { periodInMinutes: pollInterval } );
