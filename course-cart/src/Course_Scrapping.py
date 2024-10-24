import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import csv
import time

# Variables to store extracted data
extracted_data = []
seen_courses = set()

# Function to save data to CSV
def save_to_csv(data):
    with open('coursetable_data.csv', mode='w', newline='', encoding='utf-8') as csv_file:
        fieldnames = ["Tag", "Programme", "University", "Level of course", "Course Name", "Course Type", "Intake"]
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    print("Data saved to 'coursetable_data.csv'.")

# Function to extract course table data
async def extract_coursetable_data(page, tag_number):
    html_content = await page.content()
    soup = BeautifulSoup(html_content, 'html.parser')
    course_table = soup.find('table', {'id': 'coursetable'})

    if not course_table:
        print("Course table not found.")
        return []

    rows = course_table.find_all('tr')[1:]
    if not rows:
        print("No rows found in the course table.")
        return []

    course_data = []
    for row in rows:
        columns = row.find_all('td')
        if len(columns) >= 6:
            programme = columns[0].text.strip()
            university = columns[1].text.strip()
            lvl_of_course = columns[2].text.strip()
            course_name = columns[3].text.strip()
            course_type = columns[4].text.strip()
            intake = columns[5].text.strip()

            course_identifier = f"{programme}-{university}-{lvl_of_course}-{course_name}-{course_type}-{intake}"

            if course_identifier not in seen_courses:
                seen_courses.add(course_identifier)
                course_data.append({
                    "Tag": tag_number,
                    "Programme": programme,
                    "University": university,
                    "Level of course": lvl_of_course,
                    "Course Name": course_name,
                    "Course Type": course_type,
                    "Intake": intake
                })

    return course_data

# Main Playwright function
async def run_playwright():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        # Open the page
        await page.goto('https://facilities.aicte-india.org/dashboard/pages/angulardashboard.php#!/approved')

        # Select year
        await page.select_option("#year", "2024-2025")
        print("Selected year: 2024-2025")

        # Select state
        await page.select_option("#state", "Maharashtra")
        print("Selected state: Maharashtra")

        # Click the submit button
        await page.click("#load")
        print("Submit button clicked.")

        time.sleep(5)  # Wait for table to load

        tag_counter = 0
        next_page_exists = True

        while next_page_exists:
            try:
                # Fetch all course buttons
                course_buttons = await page.query_selector_all("//table[@id='jsontable']//button[contains(text(), 'Click Here')]")
                print(f"Found {len(course_buttons)} buttons.")

                for i in range(0, len(course_buttons), 2):  # Click alternate buttons
                    try:
                        course_buttons = await page.query_selector_all("//table[@id='jsontable']//button[contains(text(), 'Click Here')]")
                        button = course_buttons[i]

                        await button.scroll_into_view_if_needed()
                        await button.click()
                        print(f"Clicked button {i + 1}.")
                        await page.wait_for_timeout(5000)  # Wait for the course details to load

                        # Extract course data
                        course_data = await extract_coursetable_data(page, tag_counter)

                        retry_count = 0
                        while retry_count < 3 and not course_data:
                            print("Retrying extraction...")
                            await page.wait_for_timeout(5000)
                            course_data = await extract_coursetable_data(page, tag_counter)
                            retry_count += 1

                        tag_counter += 1
                        extracted_data.extend(course_data)

                        print(f"Extracted {len(course_data)} course entries with tag {tag_counter}.")

                        # Incremental save
                        save_to_csv(extracted_data)

                        # Return to the previous page
                        await page.go_forward()
                        await page.wait_for_selector("#jsontable")

                    except Exception as e:
                        print(f"Error while clicking button {i + 1}: {e}. Skipping to next.")
                        continue

                # Check if there is a next page
                next_button = await page.query_selector("#jsontable_next")
                if await next_button.is_disabled():
                    print("No more pages to navigate.")
                    next_page_exists = False
                else:
                    await next_button.click()
                    print("Clicked 'Next' button.")
                    await page.wait_for_timeout(3000)

            except Exception as e:
                print(f"An error occurred: {e}")
                break

        await browser.close()

# Start the extraction process
if __name__ == "__main__":
    asyncio.run(run_playwright())
